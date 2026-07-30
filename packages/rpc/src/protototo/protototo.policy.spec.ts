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

  it('awards legacy participation and correct-set points', () => {
    expect(scorePrediction([true, false, true], [true, true, true])).toBe(3);
    expect(scorePrediction(undefined, [true, true, true])).toBe(0);
    expect(scorePrediction([true, true, true], undefined)).toBe(0);
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
