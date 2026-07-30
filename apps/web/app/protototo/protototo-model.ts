export type MatchFormat = 'best_of_5' | 'four_sets' | 'four_plus_one';

export type SubjectSide = 'home' | 'away';

export type ProtototoResult = {
  setWinners: boolean[];
  final: boolean;
};

export type ProtototoMatch = {
  id: string;
  nevoboMatchId: string;
  homeTeamName: string;
  awayTeamName: string;
  startsAt: string;
  format: MatchFormat;
  subjectSide: SubjectSide;
  result: ProtototoResult | null;
  removedAt: string | null;
};

export type ProtototoRound = {
  id: string;
  title: string;
  opensAt: string;
  closesAt: string;
  tikkieUrl: string | null;
  status: 'draft' | 'scheduled' | 'open' | 'published' | 'closed' | 'archived';
  matches: ProtototoMatch[];
};

export type ProtototoPrediction = {
  matchId: string;
  setWinners: boolean[];
};

export type ProtototoEntry = {
  id: string;
  displayName: string;
  email: string | null;
  participantType: 'member' | 'anonymous';
  paymentClaimed: boolean;
  paymentClaimedAt: string | null;
  submittedAt: string;
  updatedAt: string;
  predictions: ProtototoPrediction[];
  pointsByMatch: Record<string, number>;
  totalPoints: number;
};

export type ProtototoStanding = {
  rank: number;
  displayName: string;
  totalPoints: number;
};

type JsonObject = Record<string, unknown>;

export function normalizeRound(value: unknown): ProtototoRound | null {
  if (!isObject(value)) return null;

  const source = isObject(value.round) ? value.round : value;
  const id = asString(source.id);
  const title = asString(source.title);
  const opensAt = asDateString(source.opensAt);
  const closesAt = asDateString(source.closesAt);

  if (!id || !title || !opensAt || !closesAt) return null;

  return {
    id,
    title,
    opensAt,
    closesAt,
    tikkieUrl: asNullableString(source.tikkieUrl),
    status: normalizeStatus(
      source.status,
      source.publishedAt,
      source.archivedAt,
    ),
    matches: asArray(source.matches).map(normalizeMatch).filter(isPresent),
  };
}

export function normalizeRounds(value: unknown): ProtototoRound[] {
  const values = Array.isArray(value)
    ? value
    : isObject(value) && Array.isArray(value.rounds)
      ? value.rounds
      : [];

  return values.map(normalizeRound).filter(isPresent);
}

export function normalizeEntry(value: unknown): ProtototoEntry | null {
  if (!isObject(value)) return null;
  const source = isObject(value.entry) ? value.entry : value;
  const id = asString(source.id);
  if (!id) return null;

  const pointRows = asArray(source.pointsByMatch);
  const pointsByMatch = pointRows.reduce<Record<string, number>>(
    (points, row) => {
      if (!isObject(row)) return points;
      const matchId = asString(row.matchId);
      const value = asNumber(row.points);
      if (matchId && value !== null) points[matchId] = value;
      return points;
    },
    isObject(source.pointsByMatch) ? numberRecord(source.pointsByMatch) : {},
  );

  return {
    id,
    displayName:
      asString(source.displayName) ?? asString(source.firstName) ?? 'Onbekend',
    email: asNullableString(source.email),
    participantType:
      source.participantType === 'member' || source.memberId != null
        ? 'member'
        : 'anonymous',
    paymentClaimed: source.paymentClaimed === true,
    paymentClaimedAt: asDateString(source.paymentClaimedAt),
    submittedAt:
      asDateString(source.submittedAt) ?? asDateString(source.createdAt) ?? '',
    updatedAt:
      asDateString(source.updatedAt) ?? asDateString(source.submittedAt) ?? '',
    predictions: asArray(source.predictions)
      .map(normalizePrediction)
      .filter(isPresent),
    pointsByMatch,
    totalPoints: asNumber(source.totalPoints) ?? asNumber(source.score) ?? 0,
  };
}

export function normalizeEntries(value: unknown): ProtototoEntry[] {
  const values = Array.isArray(value)
    ? value
    : isObject(value) && Array.isArray(value.entries)
      ? value.entries
      : [];

  return values.map(normalizeEntry).filter(isPresent);
}

export function normalizeStandings(value: unknown): ProtototoStanding[] {
  const values = Array.isArray(value)
    ? value
    : isObject(value) && Array.isArray(value.standings)
      ? value.standings
      : [];

  return values
    .map((standing, index) => {
      if (!isObject(standing)) return null;
      const displayName =
        asString(standing.displayName) ?? asString(standing.name);
      const totalPoints =
        asNumber(standing.totalPoints) ?? asNumber(standing.score);
      if (!displayName || totalPoints === null) return null;
      return {
        rank: asNumber(standing.rank) ?? index + 1,
        displayName,
        totalPoints,
      };
    })
    .filter(isPresent);
}

export function predictionSetCount(
  format: MatchFormat,
  setWinners: boolean[],
): number {
  if (format === 'four_sets') return 4;
  if (format === 'four_plus_one') {
    const firstFour = setWinners.slice(0, 4);
    const subjectWins = firstFour.filter(Boolean).length;
    return subjectWins === 2 ? 5 : 4;
  }

  let subjectWins = 0;
  let opponentWins = 0;
  for (const winner of setWinners.slice(0, 5)) {
    if (winner) subjectWins += 1;
    else opponentWins += 1;
    if (subjectWins === 3 || opponentWins === 3) {
      return subjectWins + opponentWins;
    }
  }
  return Math.min(5, Math.max(3, setWinners.length + 1));
}

export function isPredictionComplete(
  format: MatchFormat,
  setWinners: boolean[],
): boolean {
  if (format === 'four_sets') return setWinners.length === 4;
  if (format === 'four_plus_one') {
    if (setWinners.length !== 4 && setWinners.length !== 5) return false;
    const tied = setWinners.slice(0, 4).filter(Boolean).length === 2;
    return tied ? setWinners.length === 5 : setWinners.length === 4;
  }
  if (setWinners.length < 3 || setWinners.length > 5) return false;
  const subjectWins = setWinners.filter(Boolean).length;
  const opponentWins = setWinners.length - subjectWins;
  return (
    (subjectWins === 3 || opponentWins === 3) &&
    !(subjectWins === 3 && opponentWins === 3)
  );
}

export function roundIsOpen(round: ProtototoRound, now = new Date()): boolean {
  return (
    (round.status === 'open' || round.status === 'published') &&
    new Date(round.opensAt) <= now &&
    now < new Date(round.closesAt)
  );
}

export function participantTeamName(match: ProtototoMatch): string {
  return match.subjectSide === 'home' ? match.homeTeamName : match.awayTeamName;
}

export function opponentTeamName(match: ProtototoMatch): string {
  return match.subjectSide === 'home' ? match.awayTeamName : match.homeTeamName;
}

export function formatDateTime(value: string, locale: 'nl' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(value));
}

export function entriesToCsv(
  entries: ProtototoEntry[],
  matches: ProtototoMatch[],
): string {
  const headings = [
    'participantType',
    'displayName',
    'email',
    'paymentClaimed',
    'paymentClaimedAt',
    'submittedAt',
    'updatedAt',
    'complete',
    ...matches.map((match) => `points:${match.nevoboMatchId}`),
    'totalPoints',
  ];
  const rows = entries.map((entry) => {
    const predictedIds = new Set(
      entry.predictions.map(({ matchId }) => matchId),
    );
    return [
      entry.participantType,
      entry.displayName,
      entry.email ?? '',
      entry.paymentClaimed,
      entry.paymentClaimedAt ?? '',
      entry.submittedAt,
      entry.updatedAt,
      matches.every(({ id }) => predictedIds.has(id)),
      ...matches.map(({ id }) => entry.pointsByMatch[id] ?? 0),
      entry.totalPoints,
    ];
  });

  return [headings, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n');
}

function normalizeMatch(value: unknown): ProtototoMatch | null {
  if (!isObject(value)) return null;
  const id = asString(value.id);
  const nevoboMatchId =
    asString(value.nevoboMatchId) ?? asString(value.externalId);
  const homeTeamName = asString(value.homeTeamName) ?? asString(value.homeTeam);
  const awayTeamName = asString(value.awayTeamName) ?? asString(value.awayTeam);
  const startsAt =
    asDateString(value.startsAt) ?? asDateString(value.startTime);
  const format = normalizeFormat(value.format);
  const subjectSide = value.subjectSide === 'away' ? 'away' : 'home';
  if (!id || !nevoboMatchId || !homeTeamName || !awayTeamName || !startsAt) {
    return null;
  }
  const nestedResultWinners = isObject(value.result)
    ? asArray(value.result.setWinners).filter(isBoolean)
    : [];
  const resultSetWinners = nestedResultWinners.length
    ? nestedResultWinners
    : asArray(value.resultSetWinners).filter(isBoolean);
  return {
    id,
    nevoboMatchId,
    homeTeamName,
    awayTeamName,
    startsAt,
    format,
    subjectSide,
    result:
      resultSetWinners.length > 0
        ? {
            setWinners: resultSetWinners,
            final:
              (isObject(value.result) && value.result.final === true) ||
              Boolean(value.resultSyncedAt),
          }
        : null,
    removedAt: asDateString(value.removedAt),
  };
}

function normalizePrediction(value: unknown): ProtototoPrediction | null {
  if (!isObject(value)) return null;
  const matchId = asString(value.matchId);
  if (!matchId) return null;
  return {
    matchId,
    setWinners: asArray(value.setWinners).filter(isBoolean),
  };
}

function normalizeFormat(value: unknown): MatchFormat {
  if (value === 'four_sets' || value === 'four_plus_one') return value;
  return 'best_of_5';
}

function normalizeStatus(
  status: unknown,
  publishedAt: unknown,
  archivedAt: unknown,
): ProtototoRound['status'] {
  if (
    status === 'scheduled' ||
    status === 'open' ||
    status === 'published' ||
    status === 'closed' ||
    status === 'archived'
  )
    return status;
  if (archivedAt) return 'archived';
  if (publishedAt) return 'published';
  return 'draft';
}

function csvCell(value: unknown): string {
  const stringValue = String(value ?? '');
  const formulaSafeValue = /^[=+\-@\t\r]/.test(stringValue)
    ? `'${stringValue}`
    : stringValue;
  return `"${formulaSafeValue.replaceAll('"', '""')}"`;
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asDateString(value: unknown): string | null {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
    return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isPresent<TValue>(value: TValue | null): value is TValue {
  return value !== null;
}

function numberRecord(value: JsonObject): Record<string, number> {
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  );
}
