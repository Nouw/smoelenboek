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
      projector.projectSyncedFromAuth(
        {
          userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
          email: 'julien@example.com',
          emailVerified: true,
          name: 'Julien',
          firstName: 'Julien',
          lastName: null,
          imageUrl: null,
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
    });
    expect(repository.create).toHaveBeenCalledWith({
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        email: 'julien@example.com',
        emailVerified: true,
        name: 'Julien',
        firstName: 'Julien',
        lastName: null,
        imageUrl: null,
      }),
    );
  });

  it('updates an existing user projection', async () => {
    const entity = Object.assign(new UserEntity(), {
      id: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      authUserId: null,
      email: 'old@example.com',
      emailVerified: false,
      name: 'Old',
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

    await projector.projectSyncedFromAuth(
      {
        userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        email: 'new@example.com',
        emailVerified: true,
        name: 'New Name',
        firstName: 'New',
        lastName: 'Name',
        imageUrl: 'https://example.com/avatar.png',
      },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        email: 'new@example.com',
        emailVerified: true,
        name: 'New Name',
        firstName: 'New',
        lastName: 'Name',
        imageUrl: 'https://example.com/avatar.png',
      }),
    );
  });
});
