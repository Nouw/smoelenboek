import { DomainEventBase } from '../../event-store/domain-event';

export const USER_SYNCED_FROM_AUTH_EVENT = 'user.synced_from_auth';

export type UserSyncedFromAuthPayload = {
  userId: string;
  authUserId: string | null;
  email: string | null;
  emailVerified: boolean;
  name: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: string;
};

export type UserSyncedFromAuthMetadata = {
  source: 'better-auth';
};

export class UserSyncedFromAuthEvent extends DomainEventBase<
  UserSyncedFromAuthPayload,
  UserSyncedFromAuthMetadata
> {
  readonly aggregateType = 'user';
  readonly eventType = USER_SYNCED_FROM_AUTH_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.userId;
  }
  static create(payload: UserSyncedFromAuthPayload): UserSyncedFromAuthEvent {
    return new UserSyncedFromAuthEvent(payload, { source: 'better-auth' });
  }
}
