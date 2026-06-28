import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { StoredEventEntity } from '../entities/stored-event.entity';
import type { DomainEvent } from '../events';

export type EventProjector<TResult> = (
  storedEvent: StoredEventEntity,
  manager: EntityManager,
) => Promise<TResult>;

@Injectable()
export class EventStoreRepository {
  constructor(private readonly dataSource: DataSource) {}

  appendAndProject<TResult>(
    event: DomainEvent,
    projector: EventProjector<TResult>,
  ): Promise<TResult> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(StoredEventEntity);
      const storedEvent = repository.create(event);
      const savedEvent = await repository.save(storedEvent);

      return projector(savedEvent, manager);
    });
  }
}

