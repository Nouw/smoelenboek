import type { DomainEvent } from '../../event-store/events';

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

export type UserSyncedFromAuthEvent = DomainEvent<
  UserSyncedFromAuthPayload,
  UserSyncedFromAuthMetadata
>;

export function createUserSyncedFromAuthEvent(
  payload: UserSyncedFromAuthPayload,
): UserSyncedFromAuthEvent {
  return {
    aggregateType: 'user',
    aggregateId: payload.userId,
    eventType: USER_SYNCED_FROM_AUTH_EVENT,
    eventVersion: 1,
    payload,
    metadata: {
      source: 'better-auth',
    },
  };
}
