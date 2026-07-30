import type { TeamCategory, TeamRole } from '@repo/api';

import type { DomainEvent } from '../../event-store/events';

export const TEAM_CREATED_EVENT = 'team.created';
export const TEAM_UPDATED_EVENT = 'team.updated';
export const TEAM_ARCHIVED_EVENT = 'team.archived';
export const TEAM_RESTORED_EVENT = 'team.restored';
export const TEAM_MEMBER_ASSIGNED_EVENT = 'team.member_assigned';
export const TEAM_MEMBER_REMOVED_EVENT = 'team.member_removed';

export type TeamSnapshotPayload = {
  teamId: string;
  name: string;
  category: TeamCategory;
  imageUrl: string | null;
  archivedAt: string | null;
};

export type TeamMembershipAssignedPayload = {
  membershipId: string;
  userId: string;
  teamId: string;
  seasonKey: number;
  role: TeamRole;
  startedOn: string;
  endedOn: null;
};

export type TeamMembershipEndedPayload = {
  membershipId: string;
  removedOn: string;
};

type ManualMetadata = { source: 'manual'; actorUserId: string };

export function createTeamCreatedEvent(
  payload: TeamSnapshotPayload,
  actorUserId: string,
): DomainEvent<TeamSnapshotPayload, ManualMetadata> {
  return {
    aggregateType: 'team',
    aggregateId: payload.teamId,
    eventType: TEAM_CREATED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual', actorUserId },
  };
}

export function createTeamUpdatedEvent(
  payload: TeamSnapshotPayload,
  actorUserId: string,
): DomainEvent<TeamSnapshotPayload, ManualMetadata> {
  return {
    aggregateType: 'team',
    aggregateId: payload.teamId,
    eventType: TEAM_UPDATED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual', actorUserId },
  };
}

export function createTeamArchivedEvent(
  payload: TeamSnapshotPayload,
  actorUserId: string,
): DomainEvent<TeamSnapshotPayload, ManualMetadata> {
  return {
    aggregateType: 'team',
    aggregateId: payload.teamId,
    eventType: TEAM_ARCHIVED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual', actorUserId },
  };
}

export function createTeamRestoredEvent(
  payload: TeamSnapshotPayload,
  actorUserId: string,
): DomainEvent<TeamSnapshotPayload, ManualMetadata> {
  return {
    aggregateType: 'team',
    aggregateId: payload.teamId,
    eventType: TEAM_RESTORED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual', actorUserId },
  };
}

export function createTeamMemberAssignedEvent(
  payload: TeamMembershipAssignedPayload,
  actorUserId: string,
): DomainEvent<TeamMembershipAssignedPayload, ManualMetadata> {
  return {
    aggregateType: 'team_membership',
    aggregateId: payload.membershipId,
    eventType: TEAM_MEMBER_ASSIGNED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual', actorUserId },
  };
}

export function createTeamMemberRemovedEvent(
  payload: TeamMembershipEndedPayload,
  actorUserId: string,
): DomainEvent<TeamMembershipEndedPayload, ManualMetadata> {
  return {
    aggregateType: 'team_membership',
    aggregateId: payload.membershipId,
    eventType: TEAM_MEMBER_REMOVED_EVENT,
    eventVersion: 2,
    payload,
    metadata: { source: 'manual', actorUserId },
  };
}
