import { DomainEventBase } from '../../event-store/domain-event';

export const USER_PROFILE_UPDATED_EVENT = 'user.profile_updated';

export type UserProfileUpdatedPayload = {
  userId: string;
  imageUrl: string | null;
};

export type UserProfileUpdatedMetadata = {
  source: 'user';
};

export class UserProfileUpdatedEvent extends DomainEventBase<
  UserProfileUpdatedPayload,
  UserProfileUpdatedMetadata
> {
  readonly aggregateType = 'user';
  readonly eventType = USER_PROFILE_UPDATED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.userId;
  }
  static create(payload: UserProfileUpdatedPayload): UserProfileUpdatedEvent {
    return new UserProfileUpdatedEvent(payload, { source: 'user' });
  }
}
