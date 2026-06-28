import { describe, expect, it, jest } from '@jest/globals';

import { UserEntity } from '../entities/user.entity';
import { UserProjector } from './user-projector';

describe('UserProjector', () => {
  it('creates a user projection when none exists', async () => {
    const entity = new UserEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new UserProjector();

    await expect(
      projector.projectSyncedFromClerk(
        {
          clerkUserId: 'user_123',
          email: 'julien@example.com',
          firstName: 'Julien',
          lastName: null,
          imageUrl: null,
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      clerkUserId: 'user_123',
    });
    expect(repository.create).toHaveBeenCalledWith();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkUserId: 'user_123',
        email: 'julien@example.com',
        firstName: 'Julien',
        lastName: null,
        imageUrl: null,
      }),
    );
  });

  it('updates an existing user projection', async () => {
    const entity = Object.assign(new UserEntity(), {
      clerkUserId: 'user_123',
      email: 'old@example.com',
      firstName: 'Old',
      lastName: null,
      imageUrl: null,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new UserProjector();

    await projector.projectSyncedFromClerk(
      {
        clerkUserId: 'user_123',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Name',
        imageUrl: 'https://example.com/avatar.png',
      },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkUserId: 'user_123',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Name',
        imageUrl: 'https://example.com/avatar.png',
      }),
    );
  });
});

