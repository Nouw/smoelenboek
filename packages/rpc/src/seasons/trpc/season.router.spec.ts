import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

const authenticatedContext = {
  userId: 'user_123',
  sessionId: 'sess_123',
  orgId: null,
  authType: 'session',
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
          claims: null,
        })
        .seasons.list(),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches generate through the command bus', async () => {
    const execute = jest.fn().mockResolvedValue([]);
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter
        .createCaller(authenticatedContext)
        .seasons.generate({ startYear: 2026, endYear: 2027 }),
    ).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ startYear: 2026, endYear: 2027 }),
    );
  });

  it('dispatches current through the query bus', async () => {
    const execute = jest.fn().mockResolvedValue(null);
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });

    await expect(
      appRouter
        .createCaller(authenticatedContext)
        .seasons.current({ at: '2026-08-15T00:00:00.000Z' }),
    ).resolves.toBeNull();
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        at: new Date('2026-08-15T00:00:00.000Z'),
      }),
    );
  });
});
