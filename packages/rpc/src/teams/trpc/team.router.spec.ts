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
      appRouter.createCaller(authenticatedContext).teams.assignMember({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        seasonKey: 2025,
        role: 'setter',
      }),
    ).resolves.toEqual(expect.objectContaining({ role: 'setter' }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        seasonKey: 2025,
        role: 'setter',
      }),
    );
  });

  it('allows assignment to default to the current season', async () => {
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

    await appRouter.createCaller(authenticatedContext).teams.assignMember({
      userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
      teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      role: 'setter',
    });

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ seasonKey: undefined }),
    );
  });

  it('dispatches team creation with imageUrl', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      name: 'Heren 1',
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
      appRouter.createCaller(authenticatedContext).teams.create({
        name: 'Heren 1',
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
        imageUrl: 'https://cdn.example.com/teams/heren-1.png',
      }),
    );
  });

  it('dispatches team update without requiring imageUrl', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
      name: 'Heren 1',
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
      appRouter.createCaller(authenticatedContext).teams.update({
        id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        name: 'Heren 1',
      }),
    ).resolves.toEqual(expect.objectContaining({ imageUrl: null }));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '521ccf21-351e-41bd-a06b-8da3af4599d4',
        name: 'Heren 1',
        imageUrl: undefined,
      }),
    );
  });
});
