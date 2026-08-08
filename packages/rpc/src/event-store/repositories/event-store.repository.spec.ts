import { describe, expect, it, jest } from '@jest/globals';

import { DomainEventBase } from '../domain-event';
import { StoredEventEntity } from '../entities/stored-event.entity';
import { EventStoreRepository } from './event-store.repository';

// Minimal concrete event class for testing.
class TestEvent extends DomainEventBase<{ testId: string }, { source: string }> {
  readonly aggregateType = 'test';
  readonly eventType = 'test.happened';
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.testId; }
}

describe('EventStoreRepository', () => {
  describe('append', () => {
    it('writes toRecord() result with pending dispatch status, not the class instance', async () => {
      const storedRow = { id: 'abc', sequence: '42' };
      const create = jest.fn((obj) => obj);
      const save = jest.fn().mockResolvedValue(storedRow);
      const manager = { getRepository: jest.fn().mockReturnValue({ create, save }) };
      const transaction = jest.fn(async (callback) => callback(manager));
      const repository = new EventStoreRepository({ transaction } as never);

      const event = new TestEvent({ testId: 'test-1' }, { source: 'manual' });
      const result = await repository.append(event);

      expect(result).toBe(storedRow);
      // Must use toRecord() — prototype getter aggregateId would be dropped otherwise
      const created = (create as jest.MockedFunction<typeof create>).mock.calls[0][0] as Record<string, unknown>;
      expect(created['aggregateType']).toBe('test');
      expect(created['aggregateId']).toBe('test-1');
      expect(created['eventType']).toBe('test.happened');
      expect(created['eventVersion']).toBe(1);
      expect(created['payload']).toEqual({ testId: 'test-1' });
      expect(created['metadata']).toEqual({ source: 'manual' });
      expect(created['dispatchStatus']).toBe('pending');
      expect(created['dispatchAttempts']).toBe(0);
    });

    it('uses the provided manager instead of starting a new transaction', async () => {
      const save = jest.fn().mockResolvedValue({ id: 'stored' });
      const manager = { getRepository: jest.fn().mockReturnValue({ create: jest.fn((x) => x), save }) };
      const transaction = jest.fn();
      const repository = new EventStoreRepository({ transaction } as never);

      await repository.append(new TestEvent({ testId: 'x' }, { source: 'test' }), manager as never);

      expect(transaction).not.toHaveBeenCalled();
      expect(manager.getRepository).toHaveBeenCalledWith(StoredEventEntity);
    });
  });

  describe('appendPrepared', () => {
    it('runs prepare inside a transaction and appends the returned event', async () => {
      const storedRow = { id: 'stored-1', sequence: '1' };
      const create = jest.fn((obj) => obj);
      const save = jest.fn().mockResolvedValue(storedRow);
      const manager = { getRepository: jest.fn().mockReturnValue({ create, save }) };
      const transaction = jest.fn(async (callback) => callback(manager));
      const repository = new EventStoreRepository({ transaction } as never);

      const event = new TestEvent({ testId: 'tx-1' }, { source: 'test' });
      const prepare = jest.fn().mockResolvedValue(event);
      const result = await repository.appendPrepared(prepare);

      expect(prepare).toHaveBeenCalledWith(manager);
      expect(result.stored).toBe(storedRow);
      expect(result.event).toBe(event);
    });
  });

  describe('markDispatchFailure', () => {
    it('uses exponential backoff and marks failed after 8 attempts', async () => {
      const update = jest.fn().mockResolvedValue(undefined);
      const getRepository = jest.fn().mockReturnValue({ update });
      const repository = new EventStoreRepository({ getRepository } as never);

      const row = { id: 'r', dispatchAttempts: 7 } as StoredEventEntity;
      await repository.markDispatchFailure(row, 'boom');

      const [, updates] = (update as jest.MockedFunction<typeof update>).mock.calls[0] as [string, Record<string, unknown>];
      expect(updates['dispatchStatus']).toBe('failed');
      expect(updates['dispatchAttempts']).toBe(8);
      expect(updates['lastDispatchError']).toBe('boom');
    });

    it('retries with backoff before the 8th attempt', async () => {
      const update = jest.fn().mockResolvedValue(undefined);
      const getRepository = jest.fn().mockReturnValue({ update });
      const repository = new EventStoreRepository({ getRepository } as never);

      const row = { id: 'r', dispatchAttempts: 0 } as StoredEventEntity;
      await repository.markDispatchFailure(row, 'transient');

      const [, updates] = (update as jest.MockedFunction<typeof update>).mock.calls[0] as [string, Record<string, unknown>];
      expect(updates['dispatchStatus']).toBe('pending');
      expect(updates['dispatchAttempts']).toBe(1);
    });
  });
});
