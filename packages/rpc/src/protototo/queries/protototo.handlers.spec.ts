import { describe, expect, it, jest } from '@jest/globals';

import {
  GetProtototoStandingsHandler,
  LookupAnonymousProtototoEntryHandler,
} from './protototo.handlers';
import {
  GetProtototoStandingsQuery,
  LookupAnonymousProtototoEntryQuery,
} from './protototo.queries';

describe('LookupAnonymousProtototoEntryHandler', () => {
  it('does not reveal whether an email has entered the round', async () => {
    const repository = {
      findRound: jest.fn().mockResolvedValue({
        publishedAt: new Date('2026-09-01T00:00:00.000Z'),
        archivedAt: null,
        opensAt: new Date('2026-09-01T00:00:00.000Z'),
        closesAt: new Date('2026-10-02T00:00:00.000Z'),
      }),
      findAnonymousEntry: jest.fn().mockResolvedValue({
        firstNameNormalized: 'different-name',
      }),
    };
    const handler = new LookupAnonymousProtototoEntryHandler(
      repository as never,
    );
    const query = new LookupAnonymousProtototoEntryQuery(
      'round',
      'ada@example.com',
      'Ada',
      new Date('2026-10-01T00:00:00.000Z'),
    );

    await expect(handler.execute(query)).resolves.toBeNull();
    repository.findAnonymousEntry.mockResolvedValue(null);
    await expect(handler.execute(query)).resolves.toBeNull();
  });
});

describe('GetProtototoStandingsHandler', () => {
  it('hides standings before a deadline, including after reopening', async () => {
    const repository = repositoryFixture(new Date('2026-10-12T00:00:00.000Z'));
    const handler = new GetProtototoStandingsHandler(repository as never);
    await expect(
      handler.execute(
        new GetProtototoStandingsQuery(
          'round',
          new Date('2026-10-11T00:00:00.000Z'),
        ),
      ),
    ).rejects.toThrow('hidden until betting closes');
  });

  it('ranks tied scores consistently without exposing email or payment data', async () => {
    const repository = repositoryFixture(new Date('2026-10-10T00:00:00.000Z'));
    repository.findEntries.mockResolvedValue([
      entry('entry-b', 'Bep', 'bep@example.com'),
      entry('entry-a', 'Ada', 'ada@example.com'),
    ]);
    const handler = new GetProtototoStandingsHandler(repository as never);
    const standings = await handler.execute(
      new GetProtototoStandingsQuery(
        'round',
        new Date('2026-10-11T00:00:00.000Z'),
      ),
    );
    expect(standings).toEqual([
      {
        rank: 1,
        entryId: 'entry-a',
        displayName: 'Ada',
        participantType: 'anonymous',
        totalPoints: 4,
        matchPoints: [{ matchId: 'match', points: 4 }],
      },
      {
        rank: 1,
        entryId: 'entry-b',
        displayName: 'Bep',
        participantType: 'anonymous',
        totalPoints: 4,
        matchPoints: [{ matchId: 'match', points: 4 }],
      },
    ]);
    expect(JSON.stringify(standings)).not.toContain('@example.com');
    expect(JSON.stringify(standings)).not.toContain('payment');
  });
});

function repositoryFixture(closesAt: Date) {
  return {
    findRound: jest.fn().mockResolvedValue({
      id: 'round',
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      archivedAt: null,
      closesAt,
      matches: [
        {
          id: 'match',
          removedAt: null,
          resultSetWinners: [true, false, true],
          resultSyncedAt: new Date('2026-10-10T20:00:00.000Z'),
        },
      ],
    }),
    findEntries: jest.fn().mockResolvedValue([]),
  };
}

function entry(id: string, firstName: string, email: string) {
  return {
    id,
    roundId: 'round',
    participantType: 'anonymous',
    firstName,
    email,
    paymentClaimedAt: new Date('2026-10-01T00:00:00.000Z'),
    submittedAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    predictions: [{ matchId: 'match', setWinners: [true, false, true] }],
  };
}
