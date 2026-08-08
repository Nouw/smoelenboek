import { describe, expect, it } from '@jest/globals';
import { createPollInputSchema } from '@repo/api';

import { pollStatus, validateSelection } from './polls.policy';

const now = new Date('2026-08-08T10:00:00.000Z');
const base = {
  opensAt: new Date('2026-08-08T09:00:00.000Z'),
  closesAt: new Date('2026-08-08T11:00:00.000Z'),
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  archivedAt: null,
};

describe('poll policy', () => {
  it.each([
    [{ ...base, publishedAt: null }, 'draft'],
    [{ ...base, opensAt: new Date('2026-08-08T10:01:00.000Z') }, 'scheduled'],
    [base, 'open'],
    [{ ...base, closesAt: now }, 'closed'],
    [{ ...base, archivedAt: now }, 'archived'],
  ] as const)('derives %s as %s', (poll, expected) => {
    expect(pollStatus(poll, now)).toBe(expected);
  });

  it('validates radio and checkbox selections without duplicates or foreign options', () => {
    expect(validateSelection('single_choice', ['a'], ['a', 'b'])).toBe(true);
    expect(validateSelection('single_choice', ['a', 'b'], ['a', 'b'])).toBe(
      false,
    );
    expect(validateSelection('multiple_choice', ['a', 'b'], ['a', 'b'])).toBe(
      true,
    );
    expect(validateSelection('multiple_choice', [], ['a', 'b'])).toBe(false);
    expect(validateSelection('multiple_choice', ['a', 'a'], ['a', 'b'])).toBe(
      false,
    );
    expect(validateSelection('multiple_choice', ['c'], ['a', 'b'])).toBe(false);
  });

  it('rejects duplicate, undersized, oversized, and reversed poll definitions', () => {
    const valid = {
      question: 'Question?',
      choiceMode: 'multiple_choice' as const,
      opensAt: '2026-08-08T09:00:00.000Z',
      closesAt: '2026-08-08T10:00:00.000Z',
      options: ['A', 'B'],
    };
    expect(createPollInputSchema.safeParse(valid).success).toBe(true);
    expect(
      createPollInputSchema.safeParse({ ...valid, options: ['A'] }).success,
    ).toBe(false);
    expect(
      createPollInputSchema.safeParse({ ...valid, options: ['A', 'a'] })
        .success,
    ).toBe(false);
    expect(
      createPollInputSchema.safeParse({
        ...valid,
        options: Array.from({ length: 21 }, (_, index) => `${index}`),
      }).success,
    ).toBe(false);
    expect(
      createPollInputSchema.safeParse({ ...valid, closesAt: valid.opensAt })
        .success,
    ).toBe(false);
  });
});
