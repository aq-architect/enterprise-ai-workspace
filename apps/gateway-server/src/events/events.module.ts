import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { KafkaProducerService } from './kafka.producer';
import { KafkaConsumerService } from './kafka.consumer';

@Module({
  providers: [EventsService, KafkaProducerService, KafkaConsumerService],
  exports: [EventsService],
})
export class EventsModule {}
