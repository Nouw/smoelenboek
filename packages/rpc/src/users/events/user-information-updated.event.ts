import type { UpdateUserInformationInput } from '@repo/api';

import type { DomainEvent } from '../../event-store/events';

export const USER_INFORMATION_UPDATED_EVENT = 'user.information_updated';

export type UserInformationUpdatedPayload = {
  userId: string;
  changes: UpdateUserInformationInput;
};

export type UserInformationUpdatedMetadata = {
  source: 'user';
  actorUserId: string;
};

export type UserInformationUpdatedEvent = DomainEvent<
  UserInformationUpdatedPayload,
  UserInformationUpdatedMetadata
>;

export function createUserInformationUpdatedEvent(
  payload: UserInformationUpdatedPayload,
  actorUserId: string,
): UserInformationUpdatedEvent {
  return {
    aggregateType: 'user_information',
    aggregateId: payload.userId,
    eventType: USER_INFORMATION_UPDATED_EVENT,
    eventVersion: 1,
    payload,
    metadata: {
      source: 'user',
      actorUserId,
    },
  };
}
