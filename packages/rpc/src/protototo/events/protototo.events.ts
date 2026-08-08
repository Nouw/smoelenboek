import type { MatchFormat, SubjectSide } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

export const PROTOTOTO_ROUND_SAVED_EVENT = 'protototo.round_saved';
export const PROTOTOTO_ROUND_PUBLISHED_EVENT = 'protototo.round_published';
export const PROTOTOTO_ROUND_ARCHIVED_EVENT = 'protototo.round_archived';
export const PROTOTOTO_MATCH_SAVED_EVENT = 'protototo.match_saved';
export const PROTOTOTO_MATCH_REMOVED_EVENT = 'protototo.match_removed';
export const PROTOTOTO_ENTRY_SUBMITTED_EVENT = 'protototo.entry_submitted';
export const PROTOTOTO_MATCH_RESULT_SYNCED_EVENT =
  'protototo.match_result_synced';

export type RoundSnapshotPayload = {
  roundId: string;
  title: string;
  opensAt: string;
  closesAt: string;
  tikkieUrl: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
};

export type MatchSnapshotPayload = {
  matchId: string;
  roundId: string;
  nevoboMatchId: string;
  selectedTeamIri: string;
  homeTeamIri: string;
  homeTeamName: string;
  awayTeamIri: string;
  awayTeamName: string;
  subjectSide: SubjectSide;
  format: MatchFormat;
  pointMethodIri: string;
  startsAt: string;
  removedAt: string | null;
};

export type EntrySnapshotPayload = {
  entryId: string;
  roundId: string;
  participantType: 'member' | 'anonymous';
  userId: string | null;
  firstName: string;
  email: string | null;
  emailNormalized: string | null;
  firstNameNormalized: string | null;
  paymentClaimedAt: string | null;
  predictions: Array<{
    predictionId: string;
    matchId: string;
    setWinners: boolean[];
  }>;
};

export type ResultSyncPayload = {
  matchId: string;
  resultStatus: 'pending' | 'final' | 'cancelled' | null;
  resultSetWinners: boolean[] | null;
  resultSyncedAt: string | null;
  attemptedAt: string;
  error: string | null;
};

type AdminMetadata = { source: 'admin'; actorId: string };
type SchedulerMetadata = {
  source: 'nevobo_scheduler' | 'nevobo_manual';
  actorId?: string;
};
type ParticipantMetadata = {
  source: 'member' | 'anonymous';
  actorId?: string;
};

export class ProtototoRoundSavedEvent extends DomainEventBase<
  RoundSnapshotPayload,
  AdminMetadata
> {
  readonly aggregateType = 'protototo_round';
  readonly eventType = PROTOTOTO_ROUND_SAVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.roundId;
  }
  static create(payload: RoundSnapshotPayload, actorId: string): ProtototoRoundSavedEvent {
    return new ProtototoRoundSavedEvent(payload, { source: 'admin', actorId });
  }
}

export class ProtototoRoundPublishedEvent extends DomainEventBase<
  RoundSnapshotPayload,
  AdminMetadata
> {
  readonly aggregateType = 'protototo_round';
  readonly eventType = PROTOTOTO_ROUND_PUBLISHED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.roundId;
  }
  static create(payload: RoundSnapshotPayload, actorId: string): ProtototoRoundPublishedEvent {
    return new ProtototoRoundPublishedEvent(payload, { source: 'admin', actorId });
  }
}

export class ProtototoRoundArchivedEvent extends DomainEventBase<
  RoundSnapshotPayload,
  AdminMetadata
> {
  readonly aggregateType = 'protototo_round';
  readonly eventType = PROTOTOTO_ROUND_ARCHIVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.roundId;
  }
  static create(payload: RoundSnapshotPayload, actorId: string): ProtototoRoundArchivedEvent {
    return new ProtototoRoundArchivedEvent(payload, { source: 'admin', actorId });
  }
}

export class ProtototoMatchSavedEvent extends DomainEventBase<
  MatchSnapshotPayload,
  AdminMetadata
> {
  readonly aggregateType = 'protototo_match';
  readonly eventType = PROTOTOTO_MATCH_SAVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.matchId;
  }
  static create(payload: MatchSnapshotPayload, actorId: string): ProtototoMatchSavedEvent {
    return new ProtototoMatchSavedEvent(payload, { source: 'admin', actorId });
  }
}

export class ProtototoMatchRemovedEvent extends DomainEventBase<
  MatchSnapshotPayload,
  AdminMetadata
> {
  readonly aggregateType = 'protototo_match';
  readonly eventType = PROTOTOTO_MATCH_REMOVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.matchId;
  }
  static create(payload: MatchSnapshotPayload, actorId: string): ProtototoMatchRemovedEvent {
    return new ProtototoMatchRemovedEvent(payload, { source: 'admin', actorId });
  }
}

export class ProtototoEntrySubmittedEvent extends DomainEventBase<
  EntrySnapshotPayload,
  ParticipantMetadata
> {
  readonly aggregateType = 'protototo_entry';
  readonly eventType = PROTOTOTO_ENTRY_SUBMITTED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.entryId;
  }
  static create(
    payload: EntrySnapshotPayload,
    source: 'member' | 'anonymous',
    actorId?: string,
  ): ProtototoEntrySubmittedEvent {
    return new ProtototoEntrySubmittedEvent(
      payload,
      { source, ...(actorId ? { actorId } : {}) },
    );
  }
}

export class ProtototoMatchResultSyncedEvent extends DomainEventBase<
  ResultSyncPayload,
  SchedulerMetadata
> {
  readonly aggregateType = 'protototo_match';
  readonly eventType = PROTOTOTO_MATCH_RESULT_SYNCED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string {
    return this.payload.matchId;
  }
  static create(
    payload: ResultSyncPayload,
    source: 'nevobo_scheduler' | 'nevobo_manual',
    actorId?: string,
  ): ProtototoMatchResultSyncedEvent {
    return new ProtototoMatchResultSyncedEvent(
      payload,
      { source, ...(actorId ? { actorId } : {}) },
    );
  }
}
