import { Injectable } from '@nestjs/common';
import { KafkaProducerService } from './kafka.producer';

export interface AiGatewayEvent {
  type: string;
  userId: string;
  prompt: string;
  success: boolean;
  timestamp: string;
}

@Injectable()
export class EventsService {
  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async publishAiEvent(event: AiGatewayEvent): Promise<void> {
    await this.kafkaProducer.publish(event);
  }
}
