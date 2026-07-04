import type { DomainEvent } from '../../event-store/events';

export const USER_PROFILE_UPDATED_EVENT = 'user.profile_updated';

export type UserProfileUpdatedPayload = {
  userId: string;
  imageUrl: string | null;
};

export type UserProfileUpdatedMetadata = {
  source: 'user';
};

export type UserProfileUpdatedEvent = DomainEvent<
  UserProfileUpdatedPayload,
  UserProfileUpdatedMetadata
>;

export function createUserProfileUpdatedEvent(
  payload: UserProfileUpdatedPayload,
): UserProfileUpdatedEvent {
  return {
    aggregateType: 'user',
    aggregateId: payload.userId,
    eventType: USER_PROFILE_UPDATED_EVENT,
    eventVersion: 1,
    payload,
    metadata: {
      source: 'user',
    },
  };
}
