import type { CommitteeRole } from '@repo/api';

import type { DomainEvent } from '../../event-store/events';

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

type ManualMetadata = { source: 'manual' };

export function createCommitteeCreatedEvent(
  payload: CommitteeSnapshotPayload,
): DomainEvent<CommitteeSnapshotPayload, ManualMetadata> {
  return {
    aggregateType: 'committee',
    aggregateId: payload.committeeId,
    eventType: COMMITTEE_CREATED_EVENT,
    eventVersion: 1,
    payload,
    metadata: { source: 'manual' },
  };
}

export function createCommitteeUpdatedEvent(
  payload: CommitteeSnapshotPayload,
): DomainEvent<CommitteeSnapshotPayload, ManualMetadata> {
  return {
    aggregateType: 'committee',
    aggregateId: payload.committeeId,
    eventType: COMMITTEE_UPDATED_EVENT,
    eventVersion: 1,
    payload,
    metadata: { source: 'manual' },
  };
}

export function createCommitteeArchivedEvent(
  payload: CommitteeSnapshotPayload,
): DomainEvent<CommitteeSnapshotPayload, ManualMetadata> {
  return {
    aggregateType: 'committee',
    aggregateId: payload.committeeId,
    eventType: COMMITTEE_ARCHIVED_EVENT,
    eventVersion: 1,
    payload,
    metadata: { source: 'manual' },
  };
}

export function createCommitteeMemberAssignedEvent(
  payload: CommitteeMembershipAssignedPayload,
): DomainEvent<CommitteeMembershipAssignedPayload, ManualMetadata> {
  return {
    aggregateType: 'committee_membership',
    aggregateId: payload.membershipId,
    eventType: COMMITTEE_MEMBER_ASSIGNED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual' },
  };
}

export function createCommitteeMemberRemovedEvent(
  payload: CommitteeMembershipEndedPayload,
): DomainEvent<CommitteeMembershipEndedPayload, ManualMetadata> {
  return {
    aggregateType: 'committee_membership',
    aggregateId: payload.membershipId,
    eventType: COMMITTEE_MEMBER_REMOVED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual' },
  };
}
