import { describe, expect, it } from '@jest/globals';

import {
  canonicalFirstName,
  isRoundOpen,
  isValidPrediction,
  normalizeEmail,
  normalizeFirstName,
  scorePrediction,
} from './protototo.policy';

describe('Protototo policy', () => {
  it('normalizes anonymous identity deterministically', () => {
    expect(normalizeEmail(' Fabio@Example.COM ')).toBe('fabio@example.com');
    expect(normalizeFirstName('  FAbio   Jan ')).toBe('fabio jan');
    expect(canonicalFirstName('  Fabio   Jan ')).toBe('Fabio Jan');
  });

  it.each([
    ['best_of_5', [true, true, true], true],
    ['best_of_5', [true, false, true, false, true], true],
    ['best_of_5', [true, true, true, false], false],
    ['four_sets', [true, false, true, false], true],
    ['four_sets', [true, false, true], false],
    ['four_plus_one', [true, true, false, false, true], true],
    ['four_plus_one', [true, true, true, false], true],
    ['four_plus_one', [true, true, false, false], false],
  ] as const)('validates %s set sequences', (format, sets, expected) => {
    expect(isValidPrediction(format, sets)).toBe(expected);
  });

  it.each<[boolean[], boolean[], number, string]>([
    // [prediction, result, expected, reason]
    [
      [true, true, true],
      [true, true, true],
      5,
      'perfect 3-0: 3 sets + score + winner',
    ],
    [
      [true, false, true, true],
      [true, false, true, true],
      6,
      'perfect 3-1: 4 sets + score + winner',
    ],
    [
      [true, false, true, false, true],
      [true, false, true, false, true],
      7,
      'perfect 3-2: 5 sets + score + winner',
    ],
    [
      [false, true, true, true],
      [true, false, true, true],
      4,
      'right 3-1 score, wrong set order: 2 sets + score + winner',
    ],
    [
      [true, true, true],
      [true, false, true, false, true],
      3,
      'right winner, wrong score: 2 sets + winner',
    ],
    [
      [false, false, false],
      [true, true, true],
      0,
      'wrong winner, wrong score, no sets',
    ],
    [
      [true, true, false, false, false],
      [true, true, true],
      2,
      'wrong winner, 2 sets only',
    ],
    [
      [false, true, false, false],
      [false, false, false],
      3,
      'opponent wins 3-0 vs 3-1: 2 sets + winner',
    ],
    [
      [true, false, true, false],
      [true, false, true, false],
      5,
      'four_sets 2-2 draw: 4 sets + score, no winner point',
    ],
    [
      [true, true, true, false],
      [true, false, true, false],
      3,
      'predicted win on 2-2 draw: 3 sets, no winner point',
    ],
  ])('scores %j against %j as %i (%s)', (prediction, result, expected) => {
    expect(scorePrediction(prediction, result)).toBe(expected);
  });

  it('awards nothing without a prediction or a result', () => {
    expect(scorePrediction(undefined, [true, true, true])).toBe(0);
    expect(scorePrediction(null, [true, true, true])).toBe(0);
    expect(scorePrediction([true, true, true], undefined)).toBe(0);
    expect(scorePrediction([true, true, true], [])).toBe(0);
  });

  it('only opens published, active, non-archived rounds', () => {
    const now = new Date('2026-09-01T12:00:00.000Z');
    expect(
      isRoundOpen(
        {
          publishedAt: new Date('2026-08-01T00:00:00.000Z'),
          archivedAt: null,
          opensAt: new Date('2026-09-01T00:00:00.000Z'),
          closesAt: new Date('2026-09-02T00:00:00.000Z'),
        },
        now,
      ),
    ).toBe(true);
  });
});
