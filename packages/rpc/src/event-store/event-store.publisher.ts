import { Injectable } from '@nestjs/common';

import { DomainEventBase } from './domain-event';
import { DomainEventDispatcher } from './domain-event-dispatcher';
import { StoredEventEntity } from './entities/stored-event.entity';
import { EventStoreRepository } from './repositories/event-store.repository';
import { EntityManager } from 'typeorm';

export type PublishResult = { stored: StoredEventEntity; dispatched: boolean };

@Injectable()
export class EventStorePublisher {
  constructor(
    private readonly eventStore: EventStoreRepository,
    private readonly dispatcher: DomainEventDispatcher,
  ) {}

  // Appends the event (own transaction), then dispatches to @EventsHandler implementations.
  // Throws when the handler throws (write IS committed; sweeper converges the read model).
  // Returns { dispatched: false } when deferred due to ordering constraint (rare).
  async appendAndPublish(event: DomainEventBase): Promise<PublishResult> {
    const stored = await this.eventStore.append(event);
    const dispatched = await this.dispatcher.dispatchStored(stored, event);
    return { stored, dispatched };
  }

  // Like appendAndPublish but runs prepare(manager) inside a transaction first.
  // Useful when the command handler needs in-tx validation before building the event.
  async appendPreparedAndPublish(
    prepare: (manager: EntityManager) => Promise<DomainEventBase>,
  ): Promise<PublishResult> {
    const { stored, event } = await this.eventStore.appendPrepared(prepare);
    const dispatched = await this.dispatcher.dispatchStored(stored, event);
    return { stored, dispatched };
  }
}
