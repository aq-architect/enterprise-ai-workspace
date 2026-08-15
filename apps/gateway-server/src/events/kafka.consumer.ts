import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer!: Consumer;
  private enabled = true;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS', 'localhost:9092')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    const topic = this.configService.get<string>(
      'KAFKA_AI_EVENTS_TOPIC',
      'ai.gateway.events',
    );

    const kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'gateway-server'),
      brokers,
    });

    this.consumer = kafka.consumer({
      groupId: this.configService.get<string>(
        'KAFKA_GROUP_ID',
        'gateway-server-consumers',
      ),
    });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const value = payload.message.value?.toString() ?? '';
          this.logger.log(
            `Consumed ${payload.topic}[${payload.partition}] offset=${payload.message.offset}: ${value}`,
          );
        },
      });
      this.logger.log(`Kafka consumer subscribed to ${topic}`);
    } catch (error) {
      this.enabled = false;
      this.logger.warn(
        'Kafka consumer unavailable; continuing without event consumption',
      );
      this.logger.debug(String(error));
    }
  }

  async onModuleDestroy() {
    if (this.consumer && this.enabled) {
      await this.consumer.disconnect();
    }
  }
}
