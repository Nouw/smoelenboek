import { describe, expect, it } from '@jest/globals';

import {
  getLocalDate,
  getSeason,
  getSeasonForDate,
  getSeasonKey,
  resolveMembershipEnd,
  resolveMembershipStart,
} from './season-policy';

describe('season policy', () => {
  it('uses the Amsterdam calendar date at the August boundary', () => {
    expect(getSeasonKey(new Date('2026-07-31T21:59:59.999Z'))).toBe(2025);
    expect(getSeasonKey(new Date('2026-07-31T22:00:00.000Z'))).toBe(2026);
  });

  it('returns a half-open date-only season range', () => {
    expect(getSeason(2025)).toEqual({
      key: 2025,
      label: '2025/2026',
      startsOn: '2025-08-01',
      endsBefore: '2026-08-01',
    });
  });

  it('returns the season containing a date', () => {
    expect(getSeasonForDate(new Date('2026-07-21T12:00:00.000Z')).key).toBe(
      2025,
    );
  });

  it('formats an instant as an Amsterdam local date', () => {
    expect(getLocalDate(new Date('2026-07-31T22:00:00.000Z'))).toBe(
      '2026-08-01',
    );
  });

  it('defaults membership starts and rejects dates outside the season', () => {
    expect(resolveMembershipStart(2025)).toBe('2025-08-01');
    expect(() => resolveMembershipStart(2025, '2026-08-01')).toThrow(
      'startedOn must fall within season 2025/2026',
    );
    expect(() => resolveMembershipStart(2025, '2025-99-99')).toThrow(
      'startedOn must fall within season 2025/2026',
    );
  });

  it('rejects invalid season keys', () => {
    expect(() => getSeason(1899)).toThrow(
      'seasonKey must be an integer between 1900 and 3000',
    );
  });

  it('keeps membership end dates inside their season', () => {
    expect(resolveMembershipEnd(2024, '2024-08-01', '2026-07-21')).toBe(
      '2025-07-31',
    );
    expect(resolveMembershipEnd(2025, '2025-09-01', '2025-08-10')).toBe(
      '2025-09-01',
    );
  });
});
