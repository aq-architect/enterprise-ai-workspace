import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { AiGatewayEvent } from './events.service';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer!: Producer;
  private topic!: string;
  private enabled = true;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS', 'localhost:9092')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    this.topic = this.configService.get<string>(
      'KAFKA_AI_EVENTS_TOPIC',
      'ai.gateway.events',
    );

    const kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'gateway-server'),
      brokers,
    });

    this.producer = kafka.producer();

    try {
      await this.producer.connect();
      this.logger.log(`Kafka producer connected (topic=${this.topic})`);
    } catch (error) {
      this.enabled = false;
      this.logger.warn(
        'Kafka producer unavailable; AI events will be logged locally only',
      );
      this.logger.debug(String(error));
    }
  }

  async publish(event: AiGatewayEvent): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`Skipped Kafka publish: ${JSON.stringify(event)}`);
      return;
    }

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: event.userId,
          value: JSON.stringify(event),
        },
      ],
    });
  }

  async onModuleDestroy() {
    if (this.producer && this.enabled) {
      await this.producer.disconnect();
    }
  }
}
