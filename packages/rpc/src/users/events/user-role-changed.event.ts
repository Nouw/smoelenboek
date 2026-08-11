import type { ManagedUserRole } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

export const USER_ROLE_CHANGED_EVENT = 'user.role_changed';

export type UserRoleChangedPayload = {
  userId: string;
  role: ManagedUserRole;
};

export type UserRoleChangedMetadata = {
  source: 'admin';
  actorUserId: string;
};

export class UserRoleChangedEvent extends DomainEventBase<
  UserRoleChangedPayload,
  UserRoleChangedMetadata
> {
  readonly aggregateType = 'user';
  readonly eventType = USER_ROLE_CHANGED_EVENT;
  readonly eventVersion = 1;

  get aggregateId(): string {
    return this.payload.userId;
  }

  static create(
    payload: UserRoleChangedPayload,
    actorUserId: string,
  ): UserRoleChangedEvent {
    return new UserRoleChangedEvent(payload, {
      source: 'admin',
      actorUserId,
    });
  }
}
