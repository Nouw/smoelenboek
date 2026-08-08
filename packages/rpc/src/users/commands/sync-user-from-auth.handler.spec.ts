import { describe, expect, it, jest } from '@jest/globals';

import { UserEntity } from '../entities/user.entity';
import { UserSyncedFromAuthEvent } from '../events/user-synced-from-auth.event';
import { SyncUserFromAuthCommand } from './sync-user-from-auth.command';
import { SyncUserFromAuthHandler } from './sync-user-from-auth.handler';

const now = new Date('2026-06-27T00:00:00.000Z');
const userId = '5e3fb53f-6bb6-456d-9100-8513c76d1fdd';

function user(overrides: Partial<UserEntity> = {}): UserEntity {
  return Object.assign(new UserEntity(), {
    id: userId,
    authUserId: userId,
    email: 'julien@example.com',
    emailVerified: true,
    name: 'Julien Example',
    firstName: 'Julien',
    lastName: null,
    imageUrl: null,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe('SyncUserFromAuthHandler', () => {
  it('appends a UserSyncedFromAuthEvent and returns the projected user DTO', async () => {
    const entity = user();
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new SyncUserFromAuthHandler(
      { appendAndPublish } as never,
      { findById: jest.fn().mockResolvedValue(entity) } as never,
    );

    const result = await handler.execute(
      new SyncUserFromAuthCommand(userId, {
        sub: userId,
        email: 'julien@example.com',
        email_verified: true,
        name: 'Julien Example',
        first_name: 'Julien',
        last_name: '',
        role: 'admin',
      }),
    );

    expect(appendAndPublish).toHaveBeenCalledWith(
      expect.any(UserSyncedFromAuthEvent),
    );
    const [event] = (
      appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
    ).mock.calls[0] as [UserSyncedFromAuthEvent];
    expect(event.toRecord()).toMatchObject({
      aggregateType: 'user',
      eventType: 'user.synced_from_auth',
      eventVersion: 1,
      payload: {
        userId,
        authUserId: userId,
        email: 'julien@example.com',
        emailVerified: true,
        name: 'Julien Example',
        firstName: 'Julien',
        lastName: null,
        imageUrl: null,
        role: 'admin',
      },
      metadata: { source: 'better-auth' },
    });
    expect(result).toEqual({
      id: userId,
      authUserId: userId,
      email: 'julien@example.com',
      emailVerified: true,
      name: 'Julien Example',
      firstName: 'Julien',
      lastName: null,
      imageUrl: null,
      role: 'admin',
      createdAt: '2026-06-27T00:00:00.000Z',
      updatedAt: '2026-06-27T00:00:00.000Z',
    });
  });

  it('maps empty last_name claim to null', async () => {
    const entity = user();
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new SyncUserFromAuthHandler(
      { appendAndPublish } as never,
      { findById: jest.fn().mockResolvedValue(entity) } as never,
    );

    await handler.execute(
      new SyncUserFromAuthCommand(userId, { last_name: '' }),
    );

    const [event] = (
      appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
    ).mock.calls[0] as [UserSyncedFromAuthEvent];
    expect(event.payload.lastName).toBeNull();
  });
});
