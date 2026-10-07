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

/**
 * Points for one match:
 * - 1 per set whose winner was predicted correctly (compared by set index)
 * - 1 if the predicted set score matches the result (e.g. 3-1)
 * - 1 if the predicted match winner matches the result; a drawn result
 *   (2-2 in four_sets) has no winner and awards no winner point
 */
export function scorePrediction(
  prediction: readonly boolean[] | null | undefined,
  result: readonly boolean[] | null | undefined,
): number {
  if (!prediction || !result || result.length === 0) {
    return 0;
  }

  const correctSets = result.filter(
    (setWinner, index) => prediction[index] === setWinner,
  ).length;

  const predictedSubjectWins = wins(prediction);
  const predictedOpponentWins = prediction.length - predictedSubjectWins;
  const resultSubjectWins = wins(result);
  const resultOpponentWins = result.length - resultSubjectWins;

  const correctScore =
    predictedSubjectWins === resultSubjectWins &&
    predictedOpponentWins === resultOpponentWins;

  const resultWinner = Math.sign(resultSubjectWins - resultOpponentWins);
  const predictedWinner = Math.sign(
    predictedSubjectWins - predictedOpponentWins,
  );
  const correctWinner = resultWinner !== 0 && predictedWinner === resultWinner;

  return correctSets + (correctScore ? 1 : 0) + (correctWinner ? 1 : 0);
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
