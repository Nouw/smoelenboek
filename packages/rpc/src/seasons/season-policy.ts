import type { SeasonDto } from '@repo/api';

export const ASSOCIATION_TIME_ZONE = 'Europe/Amsterdam';
export const MIN_SEASON_KEY = 1900;
export const MAX_SEASON_KEY = 3000;

const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ASSOCIATION_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getSeasonKey(at: Date): number {
  const { year, month } = getLocalDateParts(at);

  return month >= 8 ? year : year - 1;
}

export function getSeason(key: number): SeasonDto {
  assertSeasonKey(key);

  return {
    key,
    label: `${key}/${key + 1}`,
    startsOn: `${key}-08-01`,
    endsBefore: `${key + 1}-08-01`,
  };
}

export function getSeasonForDate(at: Date): SeasonDto {
  return getSeason(getSeasonKey(at));
}

export function getLocalDate(at: Date): string {
  const { year, month, day } = getLocalDateParts(at);

  return `${year}-${pad(month)}-${pad(day)}`;
}

export function resolveMembershipStart(
  seasonKey: number,
  startedOn?: string,
): string {
  const season = getSeason(seasonKey);
  const resolved = startedOn ?? season.startsOn;

  if (
    !isIsoCalendarDate(resolved) ||
    resolved < season.startsOn ||
    resolved >= season.endsBefore
  ) {
    throw new RangeError(`startedOn must fall within season ${season.label}.`);
  }

  return resolved;
}

export function resolveMembershipEnd(
  seasonKey: number,
  startedOn: string,
  endedOn: string,
): string {
  const season = getSeason(seasonKey);
  const lastSeasonDate = `${seasonKey + 1}-07-31`;

  if (!isIsoCalendarDate(startedOn) || !isIsoCalendarDate(endedOn)) {
    throw new RangeError('Membership dates must be valid ISO calendar dates.');
  }

  if (endedOn < startedOn) {
    return startedOn;
  }

  return endedOn >= season.endsBefore ? lastSeasonDate : endedOn;
}

function isIsoCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function assertSeasonKey(key: number): void {
  if (!Number.isInteger(key) || key < MIN_SEASON_KEY || key > MAX_SEASON_KEY) {
    throw new RangeError(
      `seasonKey must be an integer between ${MIN_SEASON_KEY} and ${MAX_SEASON_KEY}.`,
    );
  }
}

function getLocalDateParts(at: Date): {
  year: number;
  month: number;
  day: number;
} {
  if (Number.isNaN(at.getTime())) {
    throw new RangeError('A valid date is required.');
  }

  const parts = localDateFormatter.formatToParts(at);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
