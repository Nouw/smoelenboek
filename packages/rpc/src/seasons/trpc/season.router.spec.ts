import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

const authenticatedContext = {
  userId: 'user_123',
  sessionId: 'sess_123',
  orgId: null,
  authType: 'session',
  role: 'user',
  claims: { sub: 'user_123' },
};

describe('season tRPC router', () => {
  it('rejects season list without authentication', async () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter
        .createCaller({
          userId: null,
          sessionId: null,
          orgId: null,
          authType: null,
          role: null,
          claims: null,
        })
        .seasons.list(),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches current through the query bus', async () => {
    const season = {
      key: 2026,
      label: '2026/2027',
      startsOn: '2026-08-01',
      endsBefore: '2027-08-01',
    };
    const execute = jest.fn().mockResolvedValue(season);
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });

    await expect(
      appRouter
        .createCaller(authenticatedContext)
        .seasons.current({ at: '2026-08-15T00:00:00.000Z' }),
    ).resolves.toEqual(season);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        at: new Date('2026-08-15T00:00:00.000Z'),
      }),
    );
  });

  it('does not expose stored-season write routes', () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });
    const procedurePaths = Object.keys(appRouter._def.procedures);

    expect(procedurePaths).not.toEqual(
      expect.arrayContaining([
        'seasons.generate',
        'seasons.create',
        'seasons.update',
        'seasons.byId',
      ]),
    );
  });
});
