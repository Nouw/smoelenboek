import type { CommitteeRole } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

export const COMMITTEE_CREATED_EVENT = 'committee.created';
export const COMMITTEE_UPDATED_EVENT = 'committee.updated';
export const COMMITTEE_ARCHIVED_EVENT = 'committee.archived';
export const COMMITTEE_MEMBER_ASSIGNED_EVENT = 'committee.member_assigned';
export const COMMITTEE_MEMBER_REMOVED_EVENT = 'committee.member_removed';

export type CommitteeSnapshotPayload = {
  committeeId: string;
  name: string;
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

export type CommitteeMembershipEndedPayload = {
  membershipId: string;
  removedOn: string;
};

export type ManualMetadata = { source: 'manual' };

export class CommitteeCreatedEvent extends DomainEventBase<CommitteeSnapshotPayload, ManualMetadata> {
  readonly aggregateType = 'committee';
  readonly eventType = COMMITTEE_CREATED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.committeeId; }
  static create(payload: CommitteeSnapshotPayload): CommitteeCreatedEvent {
    return new CommitteeCreatedEvent(payload, { source: 'manual' });
  }
}

export class CommitteeUpdatedEvent extends DomainEventBase<CommitteeSnapshotPayload, ManualMetadata> {
  readonly aggregateType = 'committee';
  readonly eventType = COMMITTEE_UPDATED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.committeeId; }
  static create(payload: CommitteeSnapshotPayload): CommitteeUpdatedEvent {
    return new CommitteeUpdatedEvent(payload, { source: 'manual' });
  }
}

export class CommitteeArchivedEvent extends DomainEventBase<CommitteeSnapshotPayload, ManualMetadata> {
  readonly aggregateType = 'committee';
  readonly eventType = COMMITTEE_ARCHIVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.committeeId; }
  static create(payload: CommitteeSnapshotPayload): CommitteeArchivedEvent {
    return new CommitteeArchivedEvent(payload, { source: 'manual' });
  }
}

export class CommitteeMemberAssignedEvent extends DomainEventBase<CommitteeMembershipAssignedPayload, ManualMetadata> {
  readonly aggregateType = 'committee_membership';
  readonly eventType = COMMITTEE_MEMBER_ASSIGNED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.membershipId; }
  static create(payload: CommitteeMembershipAssignedPayload): CommitteeMemberAssignedEvent {
    return new CommitteeMemberAssignedEvent(payload, { source: 'manual' });
  }
}

export class CommitteeMemberRemovedEvent extends DomainEventBase<CommitteeMembershipEndedPayload, ManualMetadata> {
  readonly aggregateType = 'committee_membership';
  readonly eventType = COMMITTEE_MEMBER_REMOVED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.membershipId; }
  static create(payload: CommitteeMembershipEndedPayload): CommitteeMemberRemovedEvent {
    return new CommitteeMemberRemovedEvent(payload, { source: 'manual' });
  }
}
