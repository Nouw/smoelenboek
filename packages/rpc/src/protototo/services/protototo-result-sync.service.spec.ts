import { describe, expect, it, jest } from '@jest/globals';

import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import { ProtototoResultSyncService } from './protototo-result-sync.service';

describe('ProtototoResultSyncService', () => {
  it('returns final, pending, cancelled, and failed manual counts', async () => {
    const matches = [
      match('final-already', 'final'),
      match('cancelled-already', 'cancelled'),
      match('fetch-final'),
      match('fetch-pending'),
      match('fetch-cancelled'),
      match('fetch-failed'),
    ];
    const repository = {
      findRound: jest.fn().mockResolvedValue({ id: 'round' }),
      findActiveMatches: jest.fn().mockResolvedValue(matches),
    };
    const nevobo = {
      getResult: jest.fn(async (id: string) => {
        if (id === 'fetch-final') {
          return { status: 'final' as const, setWinners: [true, true, true] };
        }
        if (id === 'fetch-pending') {
          return { status: 'pending' as const, setWinners: null };
        }
        if (id === 'fetch-cancelled') {
          return { status: 'cancelled' as const, setWinners: null };
        }
        throw new Error('safe upstream failure');
      }),
    };
    const events = {
      appendAndProject: jest.fn().mockResolvedValue(matches[0]),
    };
    const service = new ProtototoResultSyncService(
      repository as never,
      nevobo as never,
      events as never,
      {} as never,
    );

    await expect(
      service.syncRound('round', 'admin', new Date('2026-10-10T20:00:00.000Z')),
    ).resolves.toEqual({ final: 2, pending: 1, cancelled: 2, failed: 1 });
    expect(nevobo.getResult).toHaveBeenCalledTimes(4);
    expect(events.appendAndProject).toHaveBeenCalledTimes(4);
    const storedEvents = events.appendAndProject.mock.calls.map(
      ([event]) => event,
    );
    expect(storedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            resultStatus: 'final',
            resultSetWinners: [true, true, true],
            error: null,
          }),
        }),
        expect.objectContaining({
          payload: expect.objectContaining({
            resultStatus: null,
            error: 'safe upstream failure',
          }),
        }),
      ]),
    );
  });

  it('rejects a final sequence incompatible with the snapshotted format', async () => {
    const oneMatch = match('bad-final');
    const events = { appendAndProject: jest.fn().mockResolvedValue(oneMatch) };
    const service = new ProtototoResultSyncService(
      {
        findRound: jest.fn().mockResolvedValue({ id: 'round' }),
        findActiveMatches: jest.fn().mockResolvedValue([oneMatch]),
      } as never,
      {
        getResult: jest
          .fn()
          .mockResolvedValue({ status: 'final', setWinners: [true, false] }),
      } as never,
      events as never,
      {} as never,
    );

    await expect(service.syncRound('round', 'admin')).resolves.toEqual({
      final: 0,
      pending: 0,
      cancelled: 0,
      failed: 1,
    });
    expect(events.appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          error: expect.stringContaining('stored match format'),
        }),
      }),
      expect.any(Function),
    );
  });

  it('polls only the repository-selected started incomplete matches', async () => {
    const oneMatch = match('started');
    const repository = {
      findStartedUnfinishedMatches: jest.fn().mockResolvedValue([oneMatch]),
    };
    const service = new ProtototoResultSyncService(
      repository as never,
      {
        getResult: jest
          .fn()
          .mockResolvedValue({ status: 'pending', setWinners: null }),
      } as never,
      { appendAndProject: jest.fn().mockResolvedValue(oneMatch) } as never,
      {} as never,
    );
    const now = new Date('2026-10-10T20:00:00.000Z');
    await expect(service.syncStarted(now)).resolves.toEqual({
      final: 0,
      pending: 1,
      cancelled: 0,
      failed: 0,
    });
    expect(repository.findStartedUnfinishedMatches).toHaveBeenCalledWith(now);
  });
});

function match(
  nevoboMatchId: string,
  resultStatus: 'pending' | 'final' | 'cancelled' | null = null,
): ProtototoMatchEntity {
  return {
    id: `internal-${nevoboMatchId}`,
    nevoboMatchId,
    subjectSide: 'home',
    format: 'best_of_5',
    resultStatus,
    resultSetWinners: resultStatus === 'final' ? [true, true, true] : null,
  } as ProtototoMatchEntity;
}
