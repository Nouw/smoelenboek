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
const adminContext = { ...authenticatedContext, role: 'admin' };

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
          authType: null,
          role: null,
          claims: null,
        })
        .teams.list(),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('rejects current roster without authentication', async () => {
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
        .teams.currentRoster({
          teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('validates and dispatches a current roster query', async () => {
    const execute = jest.fn().mockResolvedValue({
      team: {
        id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        name: 'Heren 1',
        category: 'men',
        imageUrl: null,
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
      coaches: [],
      players: [
        {
          userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
          name: 'Example Player',
          imageUrl: null,
          role: 'setter',
        },
      ],
    });
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });

    await expect(
      appRouter.createCaller(authenticatedContext).teams.currentRoster({
        teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      }),
    ).resolves.toEqual(expect.objectContaining({ players: expect.any(Array) }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        at: expect.any(Date),
      }),
    );

    await expect(
      appRouter
        .createCaller(authenticatedContext)
        .teams.currentRoster({ teamId: 'not-a-uuid' }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches team assignment through the command bus', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
      teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      seasonKey: 2025,
      role: 'setter',
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
      appRouter.createCaller(adminContext).teams.assignMember({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        seasonKey: 2025,
        role: 'setter',
        startedOn: '2025-08-01',
      }),
    ).resolves.toEqual(expect.objectContaining({ role: 'setter' }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        seasonKey: 2025,
        role: 'setter',
        startedOn: '2025-08-01',
        actorUserId: adminContext.userId,
      }),
    );
  });

  it('rejects every team mutation for an ordinary member', async () => {
    const execute = jest.fn();
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });
    const caller = appRouter.createCaller(authenticatedContext).teams;
    const teamId = '521ccf21-351e-41bd-a06b-8da3af4599d4';
    const membershipId = '02ac256b-ce8f-44e9-8913-7569c3401264';

    const mutations = [
      () => caller.create({ name: 'Heren 20', category: 'men' }),
      () => caller.update({ id: teamId, name: 'Heren 20', category: 'men' }),
      () => caller.archive({ id: teamId }),
      () => caller.restore({ id: teamId }),
      () =>
        caller.assignMember({
          userId: authenticatedContext.userId,
          teamId,
          seasonKey: 2025,
          role: 'setter',
          startedOn: '2025-08-01',
        }),
      () => caller.removeMember({ membershipId, endedOn: '2026-07-01' }),
    ];

    for (const mutate of mutations) {
      await expect(mutate()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
    expect(execute).not.toHaveBeenCalled();
  });

  it('dispatches team creation with imageUrl', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      name: 'Heren 1',
      category: 'men',
      imageUrl: 'https://cdn.example.com/teams/heren-1.png',
      archivedAt: null,
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    });
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter.createCaller(adminContext).teams.create({
        name: 'Heren 1',
        category: 'men',
        imageUrl: 'https://cdn.example.com/teams/heren-1.png',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        imageUrl: 'https://cdn.example.com/teams/heren-1.png',
      }),
    );
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Heren 1',
        category: 'men',
        imageUrl: 'https://cdn.example.com/teams/heren-1.png',
        actorUserId: adminContext.userId,
      }),
    );
  });

  it('dispatches team update without requiring imageUrl', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      name: 'Heren 1',
      category: 'men',
      imageUrl: null,
      archivedAt: null,
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    });
    const appRouter = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    });

    await expect(
      appRouter.createCaller(adminContext).teams.update({
        id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        name: 'Heren 1',
        category: 'men',
      }),
    ).resolves.toEqual(expect.objectContaining({ imageUrl: null }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        name: 'Heren 1',
        category: 'men',
        imageUrl: undefined,
        actorUserId: adminContext.userId,
      }),
    );
  });

  it('loads an enriched arbitrary-season roster for admins only', async () => {
    const execute = jest.fn().mockResolvedValue({
      team: {
        id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        name: 'Dames 1',
        category: 'women',
        imageUrl: null,
        archivedAt: null,
        createdAt: '2026-06-28T00:00:00.000Z',
        updatedAt: '2026-06-28T00:00:00.000Z',
      },
      season: {
        key: 2021,
        label: '2021/2022',
        startsOn: '2021-08-01',
        endsBefore: '2022-08-01',
      },
      memberships: [],
    });
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute } as never,
    });
    const input = {
      teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      seasonKey: 2021,
    };

    await expect(
      appRouter.createCaller(authenticatedContext).teams.rosterForSeason(input),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      appRouter.createCaller(adminContext).teams.rosterForSeason(input),
    ).resolves.toMatchObject({ season: { key: 2021 } });
    expect(execute).toHaveBeenCalledWith(expect.objectContaining(input));
  });
});
