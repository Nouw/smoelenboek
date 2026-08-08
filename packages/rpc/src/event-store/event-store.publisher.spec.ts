import { describe, expect, it, jest } from '@jest/globals';

import { DomainEventBase } from './domain-event';
import { EventStorePublisher } from './event-store.publisher';

class TestEvent extends DomainEventBase<{ testId: string }, { source: string }> {
  readonly aggregateType = 'test';
  readonly eventType = 'test.happened';
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.testId; }
}

describe('EventStorePublisher', () => {
  function makePublisher({
    appendResolves = true,
    dispatchResult = true,
    dispatchThrows = false,
  }: {
    appendResolves?: boolean;
    dispatchResult?: boolean;
    dispatchThrows?: boolean;
  } = {}) {
    const storedRow = { id: 'stored-id', sequence: '1' };
    const append = jest.fn().mockImplementation(() =>
      appendResolves ? Promise.resolve(storedRow) : Promise.reject(new Error('DB error')),
    );
    const dispatchStored = jest.fn().mockImplementation(() => {
      if (dispatchThrows) return Promise.reject(new Error('handler boom'));
      return Promise.resolve(dispatchResult);
    });
    const eventStore = { append };
    const dispatcher = { dispatchStored };
    const publisher = new EventStorePublisher(eventStore as never, dispatcher as never);
    return { publisher, append, dispatchStored, storedRow };
  }

  it('appends the event then dispatches it', async () => {
    const { publisher, append, dispatchStored } = makePublisher();
    const event = new TestEvent({ testId: 't1' }, { source: 'test' });

    await publisher.appendAndPublish(event);

    expect(append).toHaveBeenCalledWith(event);
    expect(dispatchStored).toHaveBeenCalled();
  });

  it('dispatch is called only after append resolves', async () => {
    const order: string[] = [];
    const storedRow = { id: 'x', sequence: '1' };
    const append = jest.fn().mockImplementation(async () => {
      order.push('append');
      return storedRow;
    });
    const dispatchStored = jest.fn().mockImplementation(async () => {
      order.push('dispatch');
      return true;
    });
    const publisher = new EventStorePublisher(
      { append } as never,
      { dispatchStored } as never,
    );
    const event = new TestEvent({ testId: 'x' }, { source: 'test' });
    await publisher.appendAndPublish(event);
    expect(order).toEqual(['append', 'dispatch']);
  });

  it('does not dispatch when append transaction fails', async () => {
    const { publisher, dispatchStored } = makePublisher({ appendResolves: false });
    const event = new TestEvent({ testId: 'x' }, { source: 'test' });
    await expect(publisher.appendAndPublish(event)).rejects.toThrow('DB error');
    expect(dispatchStored).not.toHaveBeenCalled();
  });

  it('rethrows handler error after bookkeeping (write is committed)', async () => {
    const { publisher } = makePublisher({ dispatchThrows: true });
    const event = new TestEvent({ testId: 'x' }, { source: 'test' });
    await expect(publisher.appendAndPublish(event)).rejects.toThrow('handler boom');
  });

  it('returns dispatched=false when ordering guard defers', async () => {
    const { publisher } = makePublisher({ dispatchResult: false });
    const event = new TestEvent({ testId: 'x' }, { source: 'test' });
    const result = await publisher.appendAndPublish(event);
    expect(result.dispatched).toBe(false);
  });
});
