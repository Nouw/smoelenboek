import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

const authenticatedContext = {
  userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
  sessionId: 'sess_123',
  orgId: null,
  authType: 'session',
  role: 'user',
  claims: { sub: 'user_123' },
};

describe('committee tRPC router', () => {
  it('rejects committee list without authentication', async () => {
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
        .committees.list(),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches committee assignment through the command bus', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
      committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
      role: 'voorzitter',
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    });
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter.createCaller(authenticatedContext).committees.assignMember({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        seasonId: 'db20ae5d-414e-4b21-9794-08756e89b765',
        role: 'voorzitter',
      }),
    ).resolves.toEqual(expect.objectContaining({ role: 'voorzitter' }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        role: 'voorzitter',
      }),
    );
  });
});
