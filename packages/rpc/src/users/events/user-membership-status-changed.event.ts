import { DomainEventBase } from '../../event-store/domain-event';

export const USER_MEMBERSHIP_STATUS_CHANGED_EVENT = 'user.membership_status_changed';

export type UserMembershipStatusChangedPayload = {
  userId: string;
  leaveDate: string | null;
};

export class UserMembershipStatusChangedEvent extends DomainEventBase<
  UserMembershipStatusChangedPayload,
  { source: 'admin'; actorUserId: string }
> {
  readonly aggregateType = 'user_information';
  readonly eventType = USER_MEMBERSHIP_STATUS_CHANGED_EVENT;
  readonly eventVersion = 1;

  get aggregateId(): string {
    return this.payload.userId;
  }

  static create(payload: UserMembershipStatusChangedPayload, actorUserId: string): UserMembershipStatusChangedEvent {
    return new UserMembershipStatusChangedEvent(payload, { source: 'admin', actorUserId });
  }
}
