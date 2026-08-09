import { TRPCError } from '@trpc/server';
import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

const userId = 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0';
const committeeId = '521ccf21-351e-41bd-a06b-8da3af4599d4';
const membershipId = '02ac256b-ce8f-44e9-8913-7569c3401264';
const authenticatedContext = {
  userId,
  sessionId: 'sess_123',
  orgId: null,
  authType: 'session',
  role: 'user',
  claims: { sub: 'user_123' },
};
const adminContext = { ...authenticatedContext, role: 'admin' };

function app(execute = jest.fn()) {
  return createAppRouter({
    commandBus: { execute } as never,
    queryBus: { execute } as never,
  });
}

const committee = {
  id: committeeId,
  name: 'Technische commissie',
  imageUrl: null,
  archivedAt: null,
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:00.000Z',
};
const membership = {
  id: membershipId,
  userId,
  committeeId,
  seasonKey: 2025,
  role: 'voorzitter',
  startedOn: '2025-09-01',
  endedOn: null,
  createdAt: '2026-06-28T00:00:00.000Z',
  updatedAt: '2026-06-28T00:00:00.000Z',
};

describe('committee tRPC router', () => {
  it('keeps public committee reads authenticated', async () => {
    const caller = app().createCaller({
      userId: null,
      sessionId: null,
      orgId: null,
      authType: null,
      role: null,
      claims: null,
    });

    await expect(caller.committees.list()).rejects.toBeInstanceOf(TRPCError);
    await expect(
      caller.committees.currentRoster({ committeeId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('validates and dispatches the current roster query', async () => {
    const execute = jest.fn().mockResolvedValue({
      committee,
      season: {
        key: 2025,
        label: '2025/2026',
        startsOn: '2025-08-01',
        endsBefore: '2026-08-01',
      },
      members: [],
    });
    const caller = app(execute).createCaller(authenticatedContext);

    await expect(
      caller.committees.currentRoster({ committeeId }),
    ).resolves.toMatchObject({ committee });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ committeeId, at: expect.any(Date) }),
    );
    await expect(
      caller.committees.currentRoster({ committeeId: 'invalid' }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it('dispatches selected-season roster queries for admins', async () => {
    const execute = jest.fn().mockResolvedValue({
      committee,
      season: {
        key: 2024,
        label: '2024/2025',
        startsOn: '2024-08-01',
        endsBefore: '2025-08-01',
      },
      memberships: [
        {
          ...membership,
          seasonKey: 2024,
          user: {
            id: userId,
            name: 'Example Member',
            email: 'member@example.com',
            imageUrl: null,
          },
        },
      ],
    });
    const caller = app(execute).createCaller(adminContext);

    await expect(
      caller.committees.rosterForSeason({ committeeId, seasonKey: 2024 }),
    ).resolves.toMatchObject({ memberships: expect.any(Array) });
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ committeeId, seasonKey: 2024 }),
    );
  });

  it('dispatches lifecycle changes with image and actor metadata', async () => {
    const execute = jest.fn().mockResolvedValue({
      ...committee,
      imageUrl: 'https://example.com/banner.jpg',
    });
    const caller = app(execute).createCaller(adminContext).committees;

    await caller.create({
      name: committee.name,
      imageUrl: 'https://example.com/banner.jpg',
    });
    await caller.update({
      id: committeeId,
      name: committee.name,
      imageUrl: 'https://example.com/banner.jpg',
    });
    await caller.archive({ id: committeeId });
    await caller.restore({ id: committeeId });

    expect(execute).toHaveBeenCalledTimes(4);
    for (const [command] of execute.mock.calls) {
      expect(command).toMatchObject({ actorUserId: userId });
    }
    expect(execute.mock.calls[0]?.[0]).toMatchObject({
      imageUrl: 'https://example.com/banner.jpg',
    });
  });

  it('dispatches assignment and removal with explicit season and date', async () => {
    const execute = jest
      .fn()
      .mockResolvedValueOnce(membership)
      .mockResolvedValueOnce(membership);
    const caller = app(execute).createCaller(adminContext).committees;

    await caller.assignMember({
      userId,
      committeeId,
      seasonKey: 2025,
      role: 'voorzitter',
      startedOn: '2025-09-01',
    });
    await caller.removeMember({ membershipId });

    expect(execute.mock.calls[0]?.[0]).toMatchObject({
      userId,
      committeeId,
      seasonKey: 2025,
      startedOn: '2025-09-01',
      actorUserId: userId,
    });
    expect(execute.mock.calls[1]?.[0]).toMatchObject({
      membershipId,
      actorUserId: userId,
    });
  });

  it('rejects all management procedures for ordinary members', async () => {
    const caller = app().createCaller(authenticatedContext).committees;
    const calls = [
      () => caller.membershipsBySeason({ seasonKey: 2025 }),
      () => caller.rosterForSeason({ committeeId, seasonKey: 2025 }),
      () => caller.create({ name: 'Bestuur' }),
      () => caller.update({ id: committeeId, name: 'Bestuur' }),
      () => caller.archive({ id: committeeId }),
      () => caller.restore({ id: committeeId }),
      () =>
        caller.assignMember({
          userId,
          committeeId,
          seasonKey: 2025,
          role: 'voorzitter',
          startedOn: '2025-09-01',
        }),
      () => caller.removeMember({ membershipId }),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    }
  });
});
