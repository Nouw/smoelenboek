import { describe, expect, it } from '@jest/globals';

import { generateDefaultSeason, generateDefaultSeasons } from './season-generator';

describe('season generator', () => {
  it('creates the default August to July season window in UTC', () => {
    expect(generateDefaultSeason(2026)).toEqual({
      name: '2026/2027',
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2027-07-31T23:59:59.999Z'),
    });
  });

  it('generates an inclusive year range', () => {
    expect(generateDefaultSeasons(2025, 2027).map((season) => season.name)).toEqual([
      '2025/2026',
      '2026/2027',
      '2027/2028',
    ]);
  });
});

