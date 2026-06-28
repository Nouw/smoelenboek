import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StoredEventEntity } from './entities/stored-event.entity';
import { EventStoreRepository } from './repositories/event-store.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StoredEventEntity])],
  providers: [EventStoreRepository],
  exports: [EventStoreRepository],
})
export class EventStoreModule {}

