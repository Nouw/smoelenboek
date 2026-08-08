import { describe, expect, it } from '@jest/globals';

import { toAdminResultOutput } from './poll-output';

describe('poll admin output', () => {
  it('uses ballot count as the denominator for every multiple-choice option', () => {
    const poll = {
      id: '11111111-1111-4111-8111-111111111111',
      question: 'Choose all',
      choiceMode: 'multiple_choice' as const,
      opensAt: new Date('2026-08-08T09:00:00Z'),
      closesAt: new Date('2026-08-08T11:00:00Z'),
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      archivedAt: null,
      options: [
        { id: '22222222-2222-4222-8222-222222222222', label: 'A', position: 0 },
        { id: '33333333-3333-4333-8333-333333333333', label: 'B', position: 1 },
      ],
    };
    const user = {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'Member',
      firstName: null,
      lastName: null,
      email: 'member@example.com',
    };
    const date = new Date('2026-08-08T10:00:00Z');
    const result = toAdminResultOutput(
      poll,
      [
        {
          user,
          selections: poll.options.map(({ id }) => ({ optionId: id })),
          submittedAt: date,
          updatedAt: date,
        },
        {
          user: { ...user, id: '55555555-5555-4555-8555-555555555555' },
          selections: [{ optionId: poll.options[0]!.id }],
          submittedAt: date,
          updatedAt: date,
        },
      ],
      date,
    );
    expect(result.ballotCount).toBe(2);
    expect(result.options.map(({ count, percentage }) => ({ count, percentage }))).toEqual([
      { count: 2, percentage: 100 },
      { count: 1, percentage: 50 },
    ]);
  });
});
