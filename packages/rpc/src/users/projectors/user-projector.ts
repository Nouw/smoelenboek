import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UserEntity } from '../entities/user.entity';
import type { UserSyncedFromClerkPayload } from '../events/user-synced-from-clerk.event';

@Injectable()
export class UserProjector {
  async projectSyncedFromClerk(
    payload: UserSyncedFromClerkPayload,
    manager: EntityManager,
  ): Promise<UserEntity> {
    const repository = manager.getRepository(UserEntity);
    const existing = await repository.findOneBy({
      clerkUserId: payload.clerkUserId,
    });
    const entity = existing ?? repository.create();

    entity.clerkUserId = payload.clerkUserId;
    entity.email = payload.email;
    entity.firstName = payload.firstName;
    entity.lastName = payload.lastName;
    entity.imageUrl = payload.imageUrl;

    return repository.save(entity);
  }
}

