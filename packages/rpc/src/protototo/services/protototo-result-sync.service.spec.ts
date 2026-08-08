import { describe, expect, it, jest } from '@jest/globals';

import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import { ProtototoMatchResultSyncedEvent } from '../events/protototo.events';
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
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const service = new ProtototoResultSyncService(
      repository as never,
      nevobo as never,
      { appendAndPublish } as never,
    );

    await expect(
      service.syncRound('round', 'admin', new Date('2026-10-10T20:00:00.000Z')),
    ).resolves.toEqual({ final: 2, pending: 1, cancelled: 2, failed: 1 });
    expect(nevobo.getResult).toHaveBeenCalledTimes(4);
    expect(appendAndPublish).toHaveBeenCalledTimes(4);
    const storedEvents = (
      appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
    ).mock.calls.map(([event]) => event as ProtototoMatchResultSyncedEvent);
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
    for (const event of storedEvents) {
      expect(event).toBeInstanceOf(ProtototoMatchResultSyncedEvent);
    }
  });

  it('rejects a final sequence incompatible with the snapshotted format', async () => {
    const oneMatch = match('bad-final');
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
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
      { appendAndPublish } as never,
    );

    await expect(service.syncRound('round', 'admin')).resolves.toEqual({
      final: 0,
      pending: 0,
      cancelled: 0,
      failed: 1,
    });
    expect(appendAndPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          error: expect.stringContaining('stored match format'),
        }),
      }),
    );
  });

  it('polls only the repository-selected started incomplete matches', async () => {
    const oneMatch = match('started');
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
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
      { appendAndPublish } as never,
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
