import { describe, expect, it, jest } from '@jest/globals';

import { StoredEventEntity } from '../entities/stored-event.entity';
import { EventStoreRepository } from './event-store.repository';

describe('EventStoreRepository', () => {
  it('appends an event and runs the projector in one transaction', async () => {
    const savedEvent = {
      id: '2ca31107-e9a8-42f1-96f0-43bf3569650d',
      sequence: '1',
      aggregateType: 'user',
      aggregateId: 'user_123',
      eventType: 'user.synced_from_clerk',
      eventVersion: 1,
      payload: { clerkUserId: 'user_123' },
      metadata: { source: 'clerk' },
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
          eventType: 'user.synced_from_clerk',
          eventVersion: 1,
          payload: { clerkUserId: 'user_123' },
          metadata: { source: 'clerk' },
        },
        projector,
      ),
    ).resolves.toBe('projected-user');

    expect(manager.getRepository).toHaveBeenCalledWith(StoredEventEntity);
    expect(create).toHaveBeenCalledWith({
      aggregateType: 'user',
      aggregateId: 'user_123',
      eventType: 'user.synced_from_clerk',
      eventVersion: 1,
      payload: { clerkUserId: 'user_123' },
      metadata: { source: 'clerk' },
    });
    expect(save).toHaveBeenCalledWith({
      aggregateType: 'user',
      aggregateId: 'user_123',
      eventType: 'user.synced_from_clerk',
      eventVersion: 1,
      payload: { clerkUserId: 'user_123' },
      metadata: { source: 'clerk' },
    });
    expect(projector).toHaveBeenCalledWith(savedEvent, manager);
  });
});

