import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UserEntity } from '../entities/user.entity';
import type { UserProfileUpdatedPayload } from '../events/user-profile-updated.event';
import type { UserSyncedFromAuthPayload } from '../events/user-synced-from-auth.event';

@Injectable()
export class UserProjector {
  async projectSyncedFromAuth(
    payload: UserSyncedFromAuthPayload,
    manager: EntityManager,
  ): Promise<UserEntity> {
    const repository = manager.getRepository(UserEntity);
    const existing = await repository.findOneBy({
      id: payload.userId,
    });
    const entity = existing ?? repository.create({ id: payload.userId });

    entity.authUserId = payload.authUserId;
    entity.email = payload.email;
    entity.emailVerified = payload.emailVerified;
    entity.name = payload.name;
    entity.firstName = payload.firstName;
    entity.lastName = payload.lastName;
    entity.imageUrl = payload.imageUrl;
    entity.role = payload.role;

    return repository.save(entity);
  }

  async projectProfileUpdated(
    payload: UserProfileUpdatedPayload,
    manager: EntityManager,
  ): Promise<UserEntity> {
    const repository = manager.getRepository(UserEntity);
    const existing = await repository.findOneBy({
      id: payload.userId,
    });

    if (!existing) {
      throw new Error(
        `Cannot project profile update for non-existent user ${payload.userId}.`,
      );
    }

    existing.imageUrl = payload.imageUrl;

    return repository.save(existing);
  }
}
