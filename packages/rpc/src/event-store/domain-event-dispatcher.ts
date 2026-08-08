import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EventBus, IEvent, IEventHandler } from '@nestjs/cqrs';
import type { IEventPublisher } from '@nestjs/cqrs/dist/interfaces/events/event-publisher.interface';
import { DiscoveryService } from '@nestjs/core';

import { DomainEventBase } from './domain-event';
import { StoredEventEntity } from './entities/stored-event.entity';
import { EventStoreRepository } from './repositories/event-store.repository';

// '__eventsHandler__' is the internal metadata key used by @nestjs/cqrs @EventsHandler decorator.
// Hardcoded in one place; the contract gate test (domain-event-dispatcher.spec.ts) will fail
// loudly if a cqrs upgrade changes this key.
const EVENTS_HANDLER_METADATA = '__eventsHandler__';

@Injectable()
export class DomainEventDispatcher implements IEventPublisher<IEvent>, OnApplicationBootstrap {
  private readonly logger = new Logger(DomainEventDispatcher.name);
  private handlerMap = new Map<Function, IEventHandler<DomainEventBase>[]>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly eventBus: EventBus,
    private readonly eventStore: EventStoreRepository,
  ) {}

  onApplicationBootstrap(): void {
    const wrappers = this.discovery.getProviders({ metadataKey: EVENTS_HANDLER_METADATA });
    for (const wrapper of wrappers) {
      const instance = wrapper.instance as IEventHandler<DomainEventBase> | undefined;
      if (!instance || typeof instance.handle !== 'function') continue;
      const eventClasses: Function[] = Reflect.getMetadata(EVENTS_HANDLER_METADATA, Object.getPrototypeOf(instance).constructor) ?? [];
      for (const cls of eventClasses) {
        const existing = this.handlerMap.get(cls) ?? [];
        this.handlerMap.set(cls, [...existing, instance]);
      }
    }
    // Install ourselves as the EventBus publisher so eventBus.publish() is awaitable.
    this.eventBus.publisher = this;
  }

  async publish(event: IEvent): Promise<void> {
    const handlers = this.handlerMap.get(event.constructor) ?? [];
    for (const handler of handlers) {
      await handler.handle(event as DomainEventBase);
    }
  }

  // Dispatches a stored event: checks ordering guard, publishes, marks dispatched/failure.
  // Returns true when dispatched, false when deferred due to ordering constraint.
  async dispatchStored(row: StoredEventEntity, event: DomainEventBase): Promise<boolean> {
    const deferred = await this.eventStore.hasEarlierUndispatched(row.aggregateId, row.sequence);
    if (deferred) {
      this.logger.log(JSON.stringify({
        event: 'event_store.dispatch_deferred',
        storedEventId: row.id,
        aggregateId: row.aggregateId,
        sequence: row.sequence,
        eventType: row.eventType,
      }));
      return false;
    }

    try {
      await this.publish(event);
      await this.eventStore.markDispatched(row.id);
      this.logger.log(JSON.stringify({
        event: 'event_store.dispatched',
        storedEventId: row.id,
        eventType: row.eventType,
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.eventStore.markDispatchFailure(row, message);
      this.logger.error(JSON.stringify({
        event: 'event_store.dispatch_failed',
        storedEventId: row.id,
        eventType: row.eventType,
        error: message,
      }));
      throw error;
    }
  }
}
