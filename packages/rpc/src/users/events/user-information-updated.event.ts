import type { UpdateUserInformationInput } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

export const USER_INFORMATION_UPDATED_EVENT = 'user.information_updated';

export type UserInformationUpdatedPayload = {
  userId: string;
  changes: UpdateUserInformationInput;
};

export type UserInformationUpdatedMetadata = {
  source: 'user';
  actorUserId: string;
};

export class UserInformationUpdatedEvent extends DomainEventBase<
  UserInformationUpdatedPayload,
  UserInformationUpdatedMetadata
> {
  readonly aggregateType = 'user_information';
  readonly eventType = USER_INFORMATION_UPDATED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.userId;
  }
  static create(
    payload: UserInformationUpdatedPayload,
    actorUserId: string,
  ): UserInformationUpdatedEvent {
    return new UserInformationUpdatedEvent(payload, {
      source: 'user',
      actorUserId,
    });
  }
}
