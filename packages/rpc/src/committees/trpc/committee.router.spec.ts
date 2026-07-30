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

  it('rejects a current committee roster without authentication', async () => {
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
        .committees.currentRoster({
          committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('validates and dispatches a current committee roster query', async () => {
    const execute = jest.fn().mockResolvedValue({
      committee: {
        id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        name: 'Technische commissie',
        archivedAt: null,
        createdAt: '2026-07-30T00:00:00.000Z',
        updatedAt: '2026-07-30T00:00:00.000Z',
      },
      season: {
        key: 2025,
        label: '2025/2026',
        startsOn: '2025-08-01',
        endsBefore: '2026-08-01',
      },
      members: [
        {
          userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
          name: 'Example Member',
          imageUrl: null,
          role: 'voorzitter',
        },
      ],
    });
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });

    await expect(
      appRouter.createCaller(authenticatedContext).committees.currentRoster({
        committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      }),
    ).resolves.toEqual(expect.objectContaining({ members: expect.any(Array) }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        at: expect.any(Date),
      }),
    );

    await expect(
      appRouter
        .createCaller(authenticatedContext)
        .committees.currentRoster({ committeeId: 'not-a-uuid' }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches committee assignment through the command bus', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
      committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      seasonKey: 2025,
      role: 'voorzitter',
      startedOn: '2025-08-01',
      endedOn: null,
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
        seasonKey: 2025,
        role: 'voorzitter',
      }),
    ).resolves.toEqual(expect.objectContaining({ role: 'voorzitter' }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        seasonKey: 2025,
        role: 'voorzitter',
      }),
    );
  });
});
