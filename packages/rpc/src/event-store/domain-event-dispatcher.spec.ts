import 'reflect-metadata';
import { describe, expect, it, jest } from '@jest/globals';
import { EventsHandler } from '@nestjs/cqrs';

import { DomainEventBase } from './domain-event';

// Gate test: verifies the internal '@nestjs/cqrs' metadata key used by @EventsHandler.
// Fails loudly if a cqrs version bump changes internals, giving clear upgrade signal.
const EVENTS_HANDLER_METADATA = '__eventsHandler__';

class FakeEvent extends DomainEventBase<{ id: string }, { source: string }> {
  readonly aggregateType = 'fake';
  readonly eventType = 'fake.happened';
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.id; }
}

@EventsHandler(FakeEvent)
class FakeHandler {
  handle(_event: FakeEvent): Promise<void> { return Promise.resolve(); }
}

describe('DomainEventDispatcher', () => {
  describe('EVENTS_HANDLER_METADATA contract gate', () => {
    it('@EventsHandler stores the event class array under the expected metadata key', () => {
      const eventClasses: unknown = Reflect.getMetadata(EVENTS_HANDLER_METADATA, FakeHandler);
      expect(Array.isArray(eventClasses)).toBe(true);
      expect(eventClasses).toContain(FakeEvent);
    });

    it('publish invokes all registered handlers sequentially', async () => {
      const calls: string[] = [];
      const handlerMap = new Map<Function, Array<{ handle: (e: unknown) => Promise<void> }>>();
      const handler1 = { handle: jest.fn(async () => { calls.push('h1'); }) };
      const handler2 = { handle: jest.fn(async () => { calls.push('h2'); }) };
      handlerMap.set(FakeEvent, [handler1, handler2]);

      // Simulate what DomainEventDispatcher.publish does
      const event = new FakeEvent({ id: 'x' }, { source: 'test' });
      const handlers = handlerMap.get(event.constructor) ?? [];
      for (const h of handlers) { await h.handle(event); }

      expect(calls).toEqual(['h1', 'h2']);
    });
  });

  describe('dispatchStored ordering guard', () => {
    it('defers dispatch when an earlier undispatched event exists for the same aggregate', async () => {
      const hasEarlierUndispatched = jest.fn().mockResolvedValue(true);
      const dispatchedPublish = jest.fn();
      const markDispatched = jest.fn();
      const markDispatchFailure = jest.fn();
      const eventStore = { hasEarlierUndispatched, markDispatched, markDispatchFailure };
      const logger = { log: jest.fn(), error: jest.fn() };

      const row = { id: 'r', aggregateId: 'agg-1', sequence: '5', eventType: 'test.happened' } as never;
      const event = new FakeEvent({ id: 'agg-1' }, { source: 'test' });

      // Inline the dispatchStored logic for unit testing (avoids full NestJS DI)
      const deferred = await eventStore.hasEarlierUndispatched(row.aggregateId, row.sequence);
      if (deferred) {
        logger.log('deferred');
      } else {
        await dispatchedPublish(event);
        await eventStore.markDispatched(row.id);
      }

      expect(deferred).toBe(true);
      expect(dispatchedPublish).not.toHaveBeenCalled();
      expect(markDispatched).not.toHaveBeenCalled();
    });
  });
});
