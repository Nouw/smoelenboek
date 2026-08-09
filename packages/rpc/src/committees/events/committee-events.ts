import type { CommitteeRole } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

export const COMMITTEE_CREATED_EVENT = 'committee.created';
export const COMMITTEE_UPDATED_EVENT = 'committee.updated';
export const COMMITTEE_ARCHIVED_EVENT = 'committee.archived';
export const COMMITTEE_RESTORED_EVENT = 'committee.restored';
export const COMMITTEE_MEMBER_ASSIGNED_EVENT = 'committee.member_assigned';
export const COMMITTEE_MEMBER_REMOVED_EVENT = 'committee.member_removed';

export type CommitteeSnapshotPayload = {
  committeeId: string;
  name: string;
  imageUrl: string | null;
  archivedAt: string | null;
};

export type CommitteeMembershipAssignedPayload = {
  membershipId: string;
  userId: string;
  committeeId: string;
  seasonKey: number;
  role: CommitteeRole;
  startedOn: string;
  endedOn: null;
};

export type CommitteeMembershipRemovedPayload = {
  membershipId: string;
};

export type ManualMetadata = { source: 'manual'; actorUserId: string };

export class CommitteeCreatedEvent extends DomainEventBase<
  CommitteeSnapshotPayload,
  ManualMetadata
> {
  readonly aggregateType = 'committee';
  readonly eventType = COMMITTEE_CREATED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string {
    return this.payload.committeeId;
  }
  static create(
    payload: CommitteeSnapshotPayload,
    actorUserId: string,
  ): CommitteeCreatedEvent {
    return new CommitteeCreatedEvent(payload, {
      source: 'manual',
      actorUserId,
    });
  }
}

export class CommitteeUpdatedEvent extends DomainEventBase<
  CommitteeSnapshotPayload,
  ManualMetadata
> {
  readonly aggregateType = 'committee';
  readonly eventType = COMMITTEE_UPDATED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string {
    return this.payload.committeeId;
  }
  static create(
    payload: CommitteeSnapshotPayload,
    actorUserId: string,
  ): CommitteeUpdatedEvent {
    return new CommitteeUpdatedEvent(payload, {
      source: 'manual',
      actorUserId,
    });
  }
}

export class CommitteeArchivedEvent extends DomainEventBase<
  CommitteeSnapshotPayload,
  ManualMetadata
> {
  readonly aggregateType = 'committee';
  readonly eventType = COMMITTEE_ARCHIVED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string {
    return this.payload.committeeId;
  }
  static create(
    payload: CommitteeSnapshotPayload,
    actorUserId: string,
  ): CommitteeArchivedEvent {
    return new CommitteeArchivedEvent(payload, {
      source: 'manual',
      actorUserId,
    });
  }
}

export class CommitteeRestoredEvent extends DomainEventBase<
  CommitteeSnapshotPayload,
  ManualMetadata
> {
  readonly aggregateType = 'committee';
  readonly eventType = COMMITTEE_RESTORED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string {
    return this.payload.committeeId;
  }
  static create(
    payload: CommitteeSnapshotPayload,
    actorUserId: string,
  ): CommitteeRestoredEvent {
    return new CommitteeRestoredEvent(payload, {
      source: 'manual',
      actorUserId,
    });
  }
}

export class CommitteeMemberAssignedEvent extends DomainEventBase<
  CommitteeMembershipAssignedPayload,
  ManualMetadata
> {
  readonly aggregateType = 'committee_membership';
  readonly eventType = COMMITTEE_MEMBER_ASSIGNED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string {
    return this.payload.membershipId;
  }
  static create(
    payload: CommitteeMembershipAssignedPayload,
    actorUserId: string,
  ): CommitteeMemberAssignedEvent {
    return new CommitteeMemberAssignedEvent(payload, {
      source: 'manual',
      actorUserId,
    });
  }
}

export class CommitteeMemberRemovedEvent extends DomainEventBase<
  CommitteeMembershipRemovedPayload,
  ManualMetadata
> {
  readonly aggregateType = 'committee_membership';
  readonly eventType = COMMITTEE_MEMBER_REMOVED_EVENT;
  readonly eventVersion = 3;
  get aggregateId(): string {
    return this.payload.membershipId;
  }
  static create(
    payload: CommitteeMembershipRemovedPayload,
    actorUserId: string,
  ): CommitteeMemberRemovedEvent {
    return new CommitteeMemberRemovedEvent(payload, {
      source: 'manual',
      actorUserId,
    });
  }
}
