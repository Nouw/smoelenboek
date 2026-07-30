import { describe, expect, it, jest } from '@jest/globals';

import { ProtototoEntryEntity } from '../entities/protototo-entry.entity';
import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import { ProtototoPredictionEntity } from '../entities/protototo-prediction.entity';
import { ProtototoRoundEntity } from '../entities/protototo-round.entity';
import { ProtototoProjector } from './protototo.projector';

describe('ProtototoProjector', () => {
  it('replaces all predictions in the same entry projection transaction', async () => {
    const existing = { id: 'entry' };
    const entries = repository(existing);
    const predictions = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
      findBy: jest.fn().mockResolvedValue([
        {
          entryId: 'entry',
          matchId: 'match',
          setWinners: [true, true, true],
        },
      ]),
    };
    const manager = managerFor(
      new Map([
        [ProtototoEntryEntity, entries],
        [ProtototoPredictionEntity, predictions],
      ]),
    );
    const projector = new ProtototoProjector();

    const result = await projector.projectEntry(
      {
        entryId: 'entry',
        roundId: 'round',
        participantType: 'anonymous',
        userId: null,
        firstName: 'Ada',
        email: 'ada@example.com',
        emailNormalized: 'ada@example.com',
        firstNameNormalized: 'ada',
        paymentClaimedAt: '2026-10-01T12:00:00.000Z',
        predictions: [
          {
            predictionId: 'prediction',
            matchId: 'match',
            setWinners: [true, true, true],
          },
        ],
      },
      manager as never,
    );

    expect(predictions.delete).toHaveBeenCalledWith({ entryId: 'entry' });
    expect(predictions.save).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'prediction',
        entryId: 'entry',
        matchId: 'match',
      }),
    ]);
    expect(result.predictions).toHaveLength(1);
  });

  it('initializes nullable result state and projects a later final result', async () => {
    const matches = repository(null);
    const rounds = repository({ id: 'round' });
    rounds.findOneOrFail.mockResolvedValue({ id: 'round' });
    const manager = managerFor(
      new Map([
        [ProtototoMatchEntity, matches],
        [ProtototoRoundEntity, rounds],
      ]),
    );
    const projector = new ProtototoProjector();
    const projected = await projector.projectMatch(
      {
        matchId: 'match',
        roundId: 'round',
        nevoboMatchId: 'nevobo',
        selectedTeamIri: '/teams/protos',
        homeTeamIri: '/teams/protos',
        homeTeamName: 'Protos',
        awayTeamIri: '/teams/opponent',
        awayTeamName: 'Opponent',
        subjectSide: 'home',
        format: 'best_of_5',
        pointMethodIri: '/methods/best-of-five',
        startsAt: '2026-10-10T16:00:00.000Z',
        removedAt: null,
      },
      manager as never,
    );
    expect(projected).toEqual(
      expect.objectContaining({
        resultStatus: null,
        resultSetWinners: null,
        resultSyncedAt: null,
      }),
    );

    matches.findOneOrFail.mockResolvedValue(projected);
    await projector.projectResultSync(
      {
        matchId: 'match',
        resultStatus: 'final',
        resultSetWinners: [true, true, true],
        resultSyncedAt: '2026-10-10T20:00:00.000Z',
        attemptedAt: '2026-10-10T20:00:00.000Z',
        error: null,
      },
      manager as never,
    );
    expect(matches.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        resultStatus: 'final',
        resultSetWinners: [true, true, true],
        lastSyncError: null,
      }),
    );
  });

  it('does not let a concurrent failed or pending attempt erase a final result', async () => {
    const finalAt = new Date('2026-10-10T20:00:00.000Z');
    const finalMatch = {
      id: 'match',
      resultStatus: 'final' as const,
      resultSetWinners: [true, true, true],
      resultSyncedAt: finalAt,
      lastSyncAttemptAt: finalAt,
      lastSyncError: null,
    };
    const matches = repository(finalMatch);
    matches.findOneOrFail.mockResolvedValue(finalMatch);
    const manager = managerFor(new Map([[ProtototoMatchEntity, matches]]));
    const projector = new ProtototoProjector();

    for (const attempt of [
      {
        resultStatus: null,
        resultSetWinners: null,
        resultSyncedAt: null,
        error: 'Nevobo request timed out.',
      },
      {
        resultStatus: 'pending' as const,
        resultSetWinners: null,
        resultSyncedAt: null,
        error: null,
      },
    ]) {
      await projector.projectResultSync(
        {
          matchId: 'match',
          ...attempt,
          attemptedAt: '2026-10-10T20:15:00.000Z',
        },
        manager as never,
      );
      expect(matches.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          resultStatus: 'final',
          resultSetWinners: [true, true, true],
          resultSyncedAt: finalAt,
        }),
      );
    }
    expect(matches.findOneOrFail).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });
});

function repository(existing: unknown) {
  return {
    findOne: jest.fn().mockResolvedValue(existing),
    findOneBy: jest.fn().mockResolvedValue(existing),
    findOneOrFail: jest.fn(),
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn(async (value) => value),
  };
}

function managerFor(repositories: Map<unknown, unknown>) {
  return {
    getRepository(entity: unknown) {
      const repository = repositories.get(entity);
      if (!repository) throw new Error('Unexpected repository');
      return repository;
    },
  };
}
