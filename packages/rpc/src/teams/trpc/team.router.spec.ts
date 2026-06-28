import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

const authenticatedContext = {
  userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
  sessionId: 'sess_123',
  orgId: null,
  claims: { sub: 'user_123' },
};

describe('team tRPC router', () => {
  it('rejects team list without authentication', async () => {
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
          claims: null,
        })
        .teams.list(),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches team assignment through the command bus', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
      teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
      role: 'setter',
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    });
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter.createCaller(authenticatedContext).teams.assignMember({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
        role: 'setter',
      }),
    ).resolves.toEqual(expect.objectContaining({ role: 'setter' }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        role: 'setter',
      }),
    );
  });
});

