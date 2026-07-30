import type { MatchFormat, SubjectSide } from '@repo/api';

import type { DomainEvent } from '../../event-store/events';

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

type SourceMetadata = {
  source:
    | 'admin'
    | 'member'
    | 'anonymous'
    | 'nevobo_scheduler'
    | 'nevobo_manual';
  actorId?: string;
};

export function roundEvent(
  eventType:
    | 'protototo.round_saved'
    | 'protototo.round_published'
    | 'protototo.round_archived',
  payload: RoundSnapshotPayload,
  actorId: string,
): DomainEvent<RoundSnapshotPayload, SourceMetadata> {
  return {
    aggregateType: 'protototo_round',
    aggregateId: payload.roundId,
    eventType,
    eventVersion: 1,
    payload,
    metadata: { source: 'admin', actorId },
  };
}

export function matchEvent(
  eventType: 'protototo.match_saved' | 'protototo.match_removed',
  payload: MatchSnapshotPayload,
  actorId: string,
): DomainEvent<MatchSnapshotPayload, SourceMetadata> {
  return {
    aggregateType: 'protototo_match',
    aggregateId: payload.matchId,
    eventType,
    eventVersion: 1,
    payload,
    metadata: { source: 'admin', actorId },
  };
}

export function entryEvent(
  payload: EntrySnapshotPayload,
  source: 'member' | 'anonymous',
  actorId?: string,
): DomainEvent<EntrySnapshotPayload, SourceMetadata> {
  return {
    aggregateType: 'protototo_entry',
    aggregateId: payload.entryId,
    eventType: 'protototo.entry_submitted',
    eventVersion: 1,
    payload,
    metadata: { source, ...(actorId ? { actorId } : {}) },
  };
}

export function resultSyncEvent(
  payload: ResultSyncPayload,
  source: 'nevobo_scheduler' | 'nevobo_manual',
  actorId?: string,
): DomainEvent<ResultSyncPayload, SourceMetadata> {
  return {
    aggregateType: 'protototo_match',
    aggregateId: payload.matchId,
    eventType: 'protototo.match_result_synced',
    eventVersion: 1,
    payload,
    metadata: { source, ...(actorId ? { actorId } : {}) },
  };
}
