import type { DomainEvent } from '../../event-store/events';

export const USER_SYNCED_FROM_CLERK_EVENT = 'user.synced_from_clerk';

export type UserSyncedFromClerkPayload = {
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export type UserSyncedFromClerkMetadata = {
  source: 'clerk';
};

export type UserSyncedFromClerkEvent = DomainEvent<
  UserSyncedFromClerkPayload,
  UserSyncedFromClerkMetadata
>;

export function createUserSyncedFromClerkEvent(
  payload: UserSyncedFromClerkPayload,
): UserSyncedFromClerkEvent {
  return {
    aggregateType: 'user',
    aggregateId: payload.clerkUserId,
    eventType: USER_SYNCED_FROM_CLERK_EVENT,
    eventVersion: 1,
    payload,
    metadata: {
      source: 'clerk',
    },
  };
}

