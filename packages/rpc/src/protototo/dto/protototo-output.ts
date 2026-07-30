import type { MatchFormat, SubjectSide } from '@repo/api';

import { scorePrediction } from '../protototo.policy';

type MatchRecord = {
  id: string;
  roundId: string;
  nevoboMatchId: string;
  selectedTeamIri: string;
  homeTeamName: string;
  awayTeamName: string;
  subjectSide: SubjectSide;
  format: MatchFormat;
  startsAt: Date;
  resultStatus: 'pending' | 'final' | 'cancelled' | null;
  resultSetWinners: boolean[] | null;
  resultSyncedAt: Date | null;
  lastSyncAttemptAt: Date | null;
  lastSyncError: string | null;
  removedAt: Date | null;
};

type RoundRecord = {
  id: string;
  title: string;
  opensAt: Date;
  closesAt: Date;
  tikkieUrl: string | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  matches?: MatchRecord[];
};

type EntryRecord = {
  id: string;
  roundId: string;
  participantType: 'member' | 'anonymous';
  firstName: string;
  email: string | null;
  paymentClaimedAt: Date | null;
  submittedAt: Date;
  updatedAt: Date;
  predictions?: Array<{
    matchId: string;
    setWinners: boolean[];
  }>;
};

export function toMatchOutput(match: MatchRecord, includeResults = true) {
  return {
    id: match.id,
    roundId: match.roundId,
    nevoboMatchId: match.nevoboMatchId,
    selectedTeamIri: match.selectedTeamIri,
    homeTeamName: match.homeTeamName,
    awayTeamName: match.awayTeamName,
    subjectSide: match.subjectSide,
    format: match.format,
    startsAt: match.startsAt.toISOString(),
    resultStatus: includeResults ? match.resultStatus : null,
    resultSetWinners: includeResults ? match.resultSetWinners : null,
    resultSyncedAt: includeResults
      ? (match.resultSyncedAt?.toISOString() ?? null)
      : null,
    lastSyncAttemptAt: includeResults
      ? (match.lastSyncAttemptAt?.toISOString() ?? null)
      : null,
    lastSyncError: includeResults ? match.lastSyncError : null,
    removedAt: match.removedAt?.toISOString() ?? null,
  };
}

export function toRoundOutput(
  round: RoundRecord,
  now: Date,
  includeRemoved = false,
  includeTikkie = true,
  includeResults = false,
) {
  const matches = (round.matches ?? []).filter(
    (match) => includeRemoved || match.removedAt === null,
  );
  return {
    id: round.id,
    title: round.title,
    opensAt: round.opensAt.toISOString(),
    closesAt: round.closesAt.toISOString(),
    tikkieUrl: includeTikkie ? round.tikkieUrl : null,
    status: roundStatus(round, now),
    publishedAt: round.publishedAt?.toISOString() ?? null,
    archivedAt: round.archivedAt?.toISOString() ?? null,
    matches: matches
      .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
      .map((match) => toMatchOutput(match, includeResults)),
  };
}

export function toEntryOutput(entry: EntryRecord) {
  return {
    id: entry.id,
    roundId: entry.roundId,
    participantType: entry.participantType,
    displayName: entry.firstName,
    predictions: (entry.predictions ?? []).map((prediction) => ({
      matchId: prediction.matchId,
      setWinners: prediction.setWinners,
    })),
    submittedAt: entry.submittedAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export function toAdminEntryOutput(entry: EntryRecord, matches: MatchRecord[]) {
  const predictions = new Map(
    (entry.predictions ?? []).map((prediction) => [
      prediction.matchId,
      prediction.setWinners,
    ]),
  );
  const matchPoints = matches.map((match) => ({
    matchId: match.id,
    points: scorePrediction(predictions.get(match.id), match.resultSetWinners),
  }));
  return {
    ...toEntryOutput(entry),
    email: entry.email,
    paymentClaimed: entry.paymentClaimedAt !== null,
    paymentClaimedAt: entry.paymentClaimedAt?.toISOString() ?? null,
    complete: matches.every((match) => predictions.has(match.id)),
    matchPoints,
    pointsByMatch: matchPoints,
    totalPoints: matchPoints.reduce((total, match) => total + match.points, 0),
  };
}

export function roundStatus(
  round: Pick<
    RoundRecord,
    'publishedAt' | 'archivedAt' | 'opensAt' | 'closesAt'
  >,
  now: Date,
): 'draft' | 'scheduled' | 'open' | 'closed' | 'archived' {
  if (round.archivedAt) return 'archived';
  if (!round.publishedAt) return 'draft';
  if (now.getTime() < round.opensAt.getTime()) return 'scheduled';
  if (now.getTime() < round.closesAt.getTime()) return 'open';
  return 'closed';
}
