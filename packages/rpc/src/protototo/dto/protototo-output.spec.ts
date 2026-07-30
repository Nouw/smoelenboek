import { describe, expect, it } from '@jest/globals';

import {
  toAdminEntryOutput,
  toEntryOutput,
  toRoundOutput,
} from './protototo-output';

describe('Protototo outputs', () => {
  it('keeps anonymous email and payment data out of participant responses', () => {
    const entry = {
      id: 'entry',
      roundId: 'round',
      participantType: 'anonymous',
      firstName: 'Ada',
      email: 'ada@example.com',
      paymentClaimedAt: new Date('2026-10-01T12:00:00.000Z'),
      predictions: [],
      submittedAt: new Date('2026-10-01T12:00:00.000Z'),
      updatedAt: new Date('2026-10-01T12:00:00.000Z'),
    } as never;

    expect(toEntryOutput(entry)).toEqual({
      id: 'entry',
      roundId: 'round',
      participantType: 'anonymous',
      displayName: 'Ada',
      predictions: [],
      submittedAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
    });
    expect(toAdminEntryOutput(entry, [])).toEqual(
      expect.objectContaining({
        email: 'ada@example.com',
        paymentClaimed: true,
        paymentClaimedAt: '2026-10-01T12:00:00.000Z',
      }),
    );
  });

  it('hides Tikkie configuration from members', () => {
    const round = {
      id: 'round',
      title: 'October',
      opensAt: new Date('2026-10-01T00:00:00.000Z'),
      closesAt: new Date('2026-10-02T00:00:00.000Z'),
      tikkieUrl: 'https://tikkie.me/pay/example',
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      archivedAt: null,
      matches: [],
    } as never;
    expect(
      toRoundOutput(round, new Date('2026-10-01T12:00:00.000Z'), false, false)
        .tikkieUrl,
    ).toBeNull();
  });

  it('hides synchronized results again when an admin reopens betting', () => {
    const round = {
      id: 'round',
      title: 'Reopened',
      opensAt: new Date('2026-10-01T00:00:00.000Z'),
      closesAt: new Date('2026-10-12T00:00:00.000Z'),
      tikkieUrl: null,
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      archivedAt: null,
      matches: [
        {
          id: 'match',
          roundId: 'round',
          nevoboMatchId: 'nevobo',
          selectedTeamIri: '/teams/protos',
          homeTeamName: 'Protos',
          awayTeamName: 'Opponent',
          subjectSide: 'home',
          format: 'best_of_5',
          startsAt: new Date('2026-10-10T00:00:00.000Z'),
          resultStatus: 'final',
          resultSetWinners: [true, true, true],
          resultSyncedAt: new Date('2026-10-10T02:00:00.000Z'),
          lastSyncAttemptAt: new Date('2026-10-10T02:00:00.000Z'),
          lastSyncError: null,
          removedAt: null,
        },
      ],
    } as never;
    const output = toRoundOutput(
      round,
      new Date('2026-10-11T00:00:00.000Z'),
      false,
      false,
      false,
    );
    expect(output.matches[0]).toEqual(
      expect.objectContaining({
        resultStatus: null,
        resultSetWinners: null,
        resultSyncedAt: null,
      }),
    );
  });

  it('gives late-added missing predictions zero and ignores removed matches', () => {
    const entry = {
      id: 'entry',
      roundId: 'round',
      participantType: 'member',
      firstName: 'Member',
      email: null,
      paymentClaimedAt: null,
      submittedAt: new Date(),
      updatedAt: new Date(),
      predictions: [
        {
          matchId: 'predicted',
          setWinners: [true, true, true],
        },
        {
          matchId: 'removed',
          setWinners: [true, true, true],
        },
      ],
    } as never;
    const activeMatches = [
      { id: 'predicted', resultSetWinners: [true, false, true] },
      { id: 'late-added', resultSetWinners: [true, true, true] },
    ] as never;
    const output = toAdminEntryOutput(entry, activeMatches);
    expect(output.matchPoints).toEqual([
      { matchId: 'predicted', points: 3 },
      { matchId: 'late-added', points: 0 },
    ]);
    expect(output.totalPoints).toBe(3);
    expect(output.complete).toBe(false);
  });
});
