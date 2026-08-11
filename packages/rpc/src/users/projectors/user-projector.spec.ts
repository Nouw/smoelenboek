import { describe, expect, it, jest } from '@jest/globals';

import { UserEntity } from '../entities/user.entity';
import {
  UserProfileUpdatedEvent,
} from '../events/user-profile-updated.event';
import {
  UserSyncedFromAuthEvent,
} from '../events/user-synced-from-auth.event';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { UserProjector } from './user-projector';

const userId = '5e3fb53f-6bb6-456d-9100-8513c76d1fdd';

const syncedPayload = {
  userId,
  authUserId: userId,
  email: 'julien@example.com',
  emailVerified: true,
  name: 'Julien',
  firstName: 'Julien',
  lastName: null as null,
  imageUrl: null as null,
  role: 'admin',
};

function makeProjector(manager: object) {
  return new UserProjector({ manager } as never);
}

describe('UserProjector', () => {
  it('creates a user projection when none exists', async () => {
    const entity = new UserEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await expect(
      projector.projectSyncedFromAuth(
        syncedPayload,
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: userId });
    expect(repository.create).toHaveBeenCalledWith({ id: userId });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: userId,
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
      id: userId,
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
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await projector.projectSyncedFromAuth(
      { ...syncedPayload, email: 'new@example.com', name: 'New Name', firstName: 'New', lastName: 'Name', imageUrl: 'https://example.com/avatar.png' },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        emailVerified: true,
        name: 'New Name',
        firstName: 'New',
        lastName: 'Name',
        imageUrl: 'https://example.com/avatar.png',
      }),
    );
  });

  it('patches only imageUrl when projecting a profile update', async () => {
    const entity = Object.assign(new UserEntity(), {
      id: userId,
      authUserId: 'auth_123',
      email: 'julien@example.com',
      emailVerified: true,
      name: 'Julien',
      firstName: 'Julien',
      lastName: null,
      imageUrl: 'https://example.com/old-avatar.png',
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await projector.projectProfileUpdated(
      { userId, imageUrl: 'https://example.com/new-avatar.png' },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: userId });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: 'auth_123',
        email: 'julien@example.com',
        imageUrl: 'https://example.com/new-avatar.png',
      }),
    );
  });

  it('patches only the role when projecting an administrator role change', async () => {
    const entity = Object.assign(new UserEntity(), {
      id: userId,
      email: 'julien@example.com',
      name: 'Julien',
      role: 'user',
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const manager = { getRepository: jest.fn().mockReturnValue(repository) };
    const projector = makeProjector(manager);

    await projector.handle(
      UserRoleChangedEvent.create({ userId, role: 'admin' }, 'admin-id'),
    );

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: userId,
        email: 'julien@example.com',
        name: 'Julien',
        role: 'admin',
      }),
    );
  });

  it('throws when projecting a profile update for a non-existent user', async () => {
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await expect(
      projector.projectProfileUpdated(
        { userId: 'non-existent-id', imageUrl: 'https://example.com/avatar.png' },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).rejects.toThrow(
      'Cannot project profile update for non-existent user non-existent-id.',
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  describe('handle() — EventsHandler routing', () => {
    it('routes UserSyncedFromAuthEvent to projectSyncedFromAuth', async () => {
      const entity = new UserEntity();
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(
        new UserSyncedFromAuthEvent(syncedPayload, { source: 'better-auth' }),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'julien@example.com' }),
      );
    });

    it('routes UserProfileUpdatedEvent to projectProfileUpdated', async () => {
      const entity = Object.assign(new UserEntity(), { id: userId });
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(
        new UserProfileUpdatedEvent(
          { userId, imageUrl: 'https://example.com/avatar.png' },
          { source: 'user' },
        ),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: 'https://example.com/avatar.png' }),
      );
    });

    it('projectSyncedFromAuth upserts on replay', async () => {
      const entity = Object.assign(new UserEntity(), { id: userId });
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(entity),
        create: jest.fn(),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);
      const event = new UserSyncedFromAuthEvent(syncedPayload, { source: 'better-auth' });

      await projector.handle(event);
      await projector.handle(event);

      expect(repository.save).toHaveBeenCalledTimes(2);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
