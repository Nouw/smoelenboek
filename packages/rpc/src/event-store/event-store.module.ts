import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule } from '@nestjs/core';

import { StoredEventEntity } from './entities/stored-event.entity';
import { EventStoreRepository } from './repositories/event-store.repository';
import { DomainEventDispatcher } from './domain-event-dispatcher';
import { EventStorePublisher } from './event-store.publisher';
import { StoredEventSweeper } from './stored-event.sweeper';

@Module({
  imports: [TypeOrmModule.forFeature([StoredEventEntity]), DiscoveryModule],
  providers: [EventStoreRepository, DomainEventDispatcher, EventStorePublisher, StoredEventSweeper],
  exports: [EventStoreRepository, DomainEventDispatcher, EventStorePublisher],
})
export class EventStoreModule {}
