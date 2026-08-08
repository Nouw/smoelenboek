import { DomainEventBase } from '../../event-store/domain-event';

export const USER_PROVISIONED_EVENT = 'user.provisioned';

export type UserProvisionedPayload = {
  userId: string;
  email: string;
  name: string;
  preferredLocale: 'nl' | 'en';
};

export type UserProvisionedMetadata = {
  source: 'admin';
  actorId: string;
};

export class UserProvisionedEvent extends DomainEventBase<
  UserProvisionedPayload,
  UserProvisionedMetadata
> {
  readonly aggregateType = 'user';
  readonly eventType = USER_PROVISIONED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.userId;
  }
  static create(
    payload: UserProvisionedPayload,
    actorId: string,
  ): UserProvisionedEvent {
    return new UserProvisionedEvent(payload, { source: 'admin', actorId });
  }
}
