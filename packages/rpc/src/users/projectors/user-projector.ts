import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';

import { DomainEventBase } from '../../event-store/domain-event';
import { UserEntity } from '../entities/user.entity';
import {
  UserProfileUpdatedEvent,
  type UserProfileUpdatedPayload,
} from '../events/user-profile-updated.event';
import {
  UserSyncedFromAuthEvent,
  type UserSyncedFromAuthPayload,
} from '../events/user-synced-from-auth.event';

@EventsHandler(UserSyncedFromAuthEvent, UserProfileUpdatedEvent)
@Injectable()
export class UserProjector implements IEventHandler<DomainEventBase> {
  constructor(private readonly dataSource: DataSource) {}

  async handle(event: DomainEventBase): Promise<void> {
    const manager = this.dataSource.manager;
    if (event instanceof UserProfileUpdatedEvent) {
      await this.projectProfileUpdated(event.payload, manager);
    } else {
      await this.projectSyncedFromAuth(
        (event as UserSyncedFromAuthEvent).payload,
        manager,
      );
    }
  }

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
