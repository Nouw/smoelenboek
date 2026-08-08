import { describe, expect, it, jest } from '@jest/globals';

import { UserEntity } from '../entities/user.entity';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UpdateUserProfileCommand } from './update-user-profile.command';
import { UpdateUserProfileHandler } from './update-user-profile.handler';

const now = new Date('2026-07-04T00:00:00.000Z');
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
    imageUrl: 'https://example.com/new-avatar.png',
    role: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

describe('UpdateUserProfileHandler', () => {
  it('appends a UserProfileUpdatedEvent and returns the projected user DTO', async () => {
    const entity = user();
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new UpdateUserProfileHandler(
      { appendAndPublish } as never,
      { findById: jest.fn().mockResolvedValue(entity) } as never,
    );

    const result = await handler.execute(
      new UpdateUserProfileCommand(userId, {
        imageUrl: 'https://example.com/new-avatar.png',
      }),
    );

    expect(appendAndPublish).toHaveBeenCalledWith(
      expect.any(UserProfileUpdatedEvent),
    );
    const [event] = (
      appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
    ).mock.calls[0] as [UserProfileUpdatedEvent];
    expect(event.toRecord()).toMatchObject({
      aggregateType: 'user',
      eventType: 'user.profile_updated',
      eventVersion: 1,
      payload: { userId, imageUrl: 'https://example.com/new-avatar.png' },
      metadata: { source: 'user' },
    });
    expect(result).toEqual({
      id: userId,
      authUserId: userId,
      email: 'julien@example.com',
      emailVerified: true,
      name: 'Julien Example',
      firstName: 'Julien',
      lastName: null,
      imageUrl: 'https://example.com/new-avatar.png',
      role: 'user',
      createdAt: '2026-07-04T00:00:00.000Z',
      updatedAt: '2026-07-04T00:00:00.000Z',
    });
  });

  it('handles null imageUrl', async () => {
    const entity = user({ imageUrl: null });
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = new UpdateUserProfileHandler(
      { appendAndPublish } as never,
      { findById: jest.fn().mockResolvedValue(entity) } as never,
    );

    const result = await handler.execute(
      new UpdateUserProfileCommand(userId, { imageUrl: null }),
    );

    expect(appendAndPublish).toHaveBeenCalledWith(
      expect.any(UserProfileUpdatedEvent),
    );
    const [event] = (
      appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
    ).mock.calls[0] as [UserProfileUpdatedEvent];
    expect(event.payload.imageUrl).toBeNull();
    expect(result).toMatchObject({ imageUrl: null });
  });
});
