import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { StoredEventEntity } from '../entities/stored-event.entity';
import type { DomainEvent } from '../events';

export type EventProjector<TResult> = (
  storedEvent: StoredEventEntity,
  manager: EntityManager,
) => Promise<TResult>;

export type PreparedEventProjector<
  TPayload extends Record<string, unknown>,
  TMetadata extends Record<string, unknown>,
  TResult,
> = (
  event: DomainEvent<TPayload, TMetadata>,
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
    return this.dataSource.transaction((manager) =>
      this.appendWithManager(event, manager, (_event, stored) =>
        projector(stored, manager),
      ),
    );
  }

  appendPreparedAndProject<
    TPayload extends Record<string, unknown>,
    TMetadata extends Record<string, unknown>,
    TResult,
  >(
    prepare: (
      manager: EntityManager,
    ) => Promise<DomainEvent<TPayload, TMetadata>>,
    projector: PreparedEventProjector<TPayload, TMetadata, TResult>,
  ): Promise<TResult> {
    return this.dataSource.transaction(async (manager) => {
      const event = await prepare(manager);
      return this.appendWithManager(event, manager, projector);
    });
  }

  private async appendWithManager<
    TPayload extends Record<string, unknown>,
    TMetadata extends Record<string, unknown>,
    TResult,
  >(
    event: DomainEvent<TPayload, TMetadata>,
    manager: EntityManager,
    projector: PreparedEventProjector<TPayload, TMetadata, TResult>,
  ): Promise<TResult> {
    const repository = manager.getRepository(StoredEventEntity);
    const storedEvent = repository.create(event);
    const savedEvent = await repository.save(storedEvent);
    return projector(event, savedEvent, manager);
  }
}
