import type { TeamCategory, TeamRole } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

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

export type TeamMembershipRemovedPayload = {
  membershipId: string;
};

export type ManualMetadata = { source: 'manual'; actorUserId: string };

export class TeamCreatedEvent extends DomainEventBase<TeamSnapshotPayload, ManualMetadata> {
  readonly aggregateType = 'team';
  readonly eventType = TEAM_CREATED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.teamId; }
  static create(payload: TeamSnapshotPayload, actorUserId: string): TeamCreatedEvent {
    return new TeamCreatedEvent(payload, { source: 'manual', actorUserId });
  }
}

export class TeamUpdatedEvent extends DomainEventBase<TeamSnapshotPayload, ManualMetadata> {
  readonly aggregateType = 'team';
  readonly eventType = TEAM_UPDATED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.teamId; }
  static create(payload: TeamSnapshotPayload, actorUserId: string): TeamUpdatedEvent {
    return new TeamUpdatedEvent(payload, { source: 'manual', actorUserId });
  }
}

export class TeamArchivedEvent extends DomainEventBase<TeamSnapshotPayload, ManualMetadata> {
  readonly aggregateType = 'team';
  readonly eventType = TEAM_ARCHIVED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.teamId; }
  static create(payload: TeamSnapshotPayload, actorUserId: string): TeamArchivedEvent {
    return new TeamArchivedEvent(payload, { source: 'manual', actorUserId });
  }
}

export class TeamRestoredEvent extends DomainEventBase<TeamSnapshotPayload, ManualMetadata> {
  readonly aggregateType = 'team';
  readonly eventType = TEAM_RESTORED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.teamId; }
  static create(payload: TeamSnapshotPayload, actorUserId: string): TeamRestoredEvent {
    return new TeamRestoredEvent(payload, { source: 'manual', actorUserId });
  }
}

export class TeamMemberAssignedEvent extends DomainEventBase<TeamMembershipAssignedPayload, ManualMetadata> {
  readonly aggregateType = 'team_membership';
  readonly eventType = TEAM_MEMBER_ASSIGNED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.membershipId; }
  static create(payload: TeamMembershipAssignedPayload, actorUserId: string): TeamMemberAssignedEvent {
    return new TeamMemberAssignedEvent(payload, { source: 'manual', actorUserId });
  }
}

export class TeamMemberRemovedEvent extends DomainEventBase<TeamMembershipRemovedPayload, ManualMetadata> {
  readonly aggregateType = 'team_membership';
  readonly eventType = TEAM_MEMBER_REMOVED_EVENT;
  readonly eventVersion = 3;
  get aggregateId(): string { return this.payload.membershipId; }
  static create(payload: TeamMembershipRemovedPayload, actorUserId: string): TeamMemberRemovedEvent {
    return new TeamMemberRemovedEvent(payload, { source: 'manual', actorUserId });
  }
}
