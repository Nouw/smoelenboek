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
  it('appends an event and runs the projector in one transaction', async () => {
    const savedEvent = {
      id: '2ca31107-e9a8-42f1-96f0-43bf3569650d',
      sequence: '1',
      aggregateType: 'user',
      aggregateId: 'user_123',
      eventType: 'user.synced_from_auth',
      eventVersion: 1,
      payload: { userId: 'user_123' },
      metadata: { source: 'better-auth' },
      occurredAt: new Date('2026-06-28T00:00:00.000Z'),
    };
    const create = jest.fn((event) => event);
    const save = jest.fn().mockResolvedValue(savedEvent);
    const manager = {
      getRepository: jest.fn().mockReturnValue({ create, save }),
    };
    const transaction = jest.fn(async (callback) => callback(manager));
    const repository = new EventStoreRepository({ transaction } as never);
    const projector = jest.fn().mockResolvedValue('projected-user');

    await expect(
      repository.appendAndProject(
        {
          aggregateType: 'user',
          aggregateId: 'user_123',
          eventType: 'user.synced_from_auth',
          eventVersion: 1,
          payload: { userId: 'user_123' },
          metadata: { source: 'better-auth' },
        },
        projector,
      ),
    ).resolves.toBe('projected-user');

    expect(manager.getRepository).toHaveBeenCalledWith(StoredEventEntity);
    expect(create).toHaveBeenCalledWith({
      aggregateType: 'user',
      aggregateId: 'user_123',
      eventType: 'user.synced_from_auth',
      eventVersion: 1,
      payload: { userId: 'user_123' },
      metadata: { source: 'better-auth' },
    });
    expect(save).toHaveBeenCalledWith({
      aggregateType: 'user',
      aggregateId: 'user_123',
      eventType: 'user.synced_from_auth',
      eventVersion: 1,
      payload: { userId: 'user_123' },
      metadata: { source: 'better-auth' },
    });
    expect(projector).toHaveBeenCalledWith(savedEvent, manager);
  });

  it('prepares validation and appends its event in the same transaction', async () => {
    const event = {
      aggregateType: 'protototo_entry',
      aggregateId: 'entry',
      eventType: 'protototo.entry_submitted',
      eventVersion: 1,
      payload: { entryId: 'entry' },
      metadata: { source: 'anonymous' },
    };
    const savedEvent = { ...event, id: 'stored-event' };
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        create: jest.fn().mockReturnValue(event),
        save: jest.fn().mockResolvedValue(savedEvent),
      }),
    };
    const repository = new EventStoreRepository({
      transaction: jest.fn(async (callback) => callback(manager)),
    } as never);
    const prepare = jest.fn().mockResolvedValue(event);
    const projector = jest.fn().mockResolvedValue('projected-entry');

    await expect(
      repository.appendPreparedAndProject(prepare, projector),
    ).resolves.toBe('projected-entry');
    expect(prepare).toHaveBeenCalledWith(manager);
    expect(projector).toHaveBeenCalledWith(event, savedEvent, manager);
  });

  describe('append (new API)', () => {
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
