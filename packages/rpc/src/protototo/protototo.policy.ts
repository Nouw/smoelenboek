import type { MatchFormat } from '@repo/api';

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

export function normalizeFirstName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('nl-NL');
}

export function canonicalFirstName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isValidPrediction(
  format: MatchFormat,
  setWinners: readonly boolean[],
): boolean {
  if (format === 'four_sets') {
    return setWinners.length === 4;
  }

  if (format === 'four_plus_one') {
    if (setWinners.length === 4) {
      return wins(setWinners) !== 2;
    }

    return setWinners.length === 5 && wins(setWinners.slice(0, 4)) === 2;
  }

  if (setWinners.length < 3 || setWinners.length > 5) {
    return false;
  }

  const beforeLast = setWinners.slice(0, -1);
  if (wins(beforeLast) >= 3 || beforeLast.length - wins(beforeLast) >= 3) {
    return false;
  }

  const subjectWins = wins(setWinners);
  const opponentWins = setWinners.length - subjectWins;
  return subjectWins === 3 || opponentWins === 3;
}

export function scorePrediction(
  prediction: readonly boolean[] | null | undefined,
  result: readonly boolean[] | null | undefined,
): number {
  if (!prediction || !result || result.length === 0) {
    return 0;
  }

  return (
    1 +
    result.reduce(
      (score, setWinner, index) =>
        score + (prediction[index] === setWinner ? 1 : 0),
      0,
    )
  );
}

export function isRoundOpen(
  round: {
    publishedAt: Date | null;
    archivedAt: Date | null;
    opensAt: Date;
    closesAt: Date;
  },
  now: Date,
): boolean {
  return (
    round.publishedAt !== null &&
    round.archivedAt === null &&
    round.opensAt.getTime() <= now.getTime() &&
    now.getTime() < round.closesAt.getTime()
  );
}

function wins(setWinners: readonly boolean[]): number {
  return setWinners.filter(Boolean).length;
}
