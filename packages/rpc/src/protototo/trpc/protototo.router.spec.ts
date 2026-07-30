import { describe, expect, it, jest } from '@jest/globals';

import { createAppRouter } from '../../router';

const anonymous = {
  userId: null,
  sessionId: null,
  orgId: null,
  authType: null,
  role: null,
  passwordMigrationRequired: false,
  claims: null,
} as const;
const member = {
  ...anonymous,
  userId: '11111111-1111-4111-8111-111111111111',
  sessionId: 'session-1',
  authType: 'session' as const,
  role: 'user',
};

describe('Protototo tRPC router', () => {
  it('documents every procedure with its actual authentication boundary', () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    });
    const procedures = appRouter._def.procedures as unknown as Record<
      string,
      {
        _def: {
          meta?: {
            name?: unknown;
            docs?: { description?: unknown; auth?: unknown };
          };
        };
      }
    >;
    const expectedAuthentication = {
      'protototo.current': false,
      'protototo.lookupAnonymousEntry': false,
      'protototo.submitEntry': false,
      'protototo.memberRounds': true,
      'protototo.myEntry': true,
      'protototo.standings': true,
      'protototo.admin.listRounds': true,
      'protototo.admin.getRound': true,
      'protototo.admin.createRound': true,
      'protototo.admin.updateRound': true,
      'protototo.admin.publishRound': true,
      'protototo.admin.archiveRound': true,
      'protototo.admin.listNevoboTeams': true,
      'protototo.admin.listNevoboMatches': true,
      'protototo.admin.addMatch': true,
      'protototo.admin.removeMatch': true,
      'protototo.admin.syncResults': true,
      'protototo.admin.listEntries': true,
    } as const;

    for (const [path, auth] of Object.entries(expectedAuthentication)) {
      const meta = procedures[path]?._def.meta;
      expect(meta?.name).toEqual(expect.any(String));
      expect(meta?.docs?.description).toEqual(expect.any(String));
      expect(meta?.docs?.auth).toBe(auth);
    }
  });

  it('allows an anonymous complete entry mutation', async () => {
    const execute = jest.fn().mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      roundId: '33333333-3333-4333-8333-333333333333',
      participantType: 'anonymous',
      firstName: 'Ada',
      paymentClaimedAt: new Date(),
      predictions: [],
      submittedAt: new Date(),
      updatedAt: new Date(),
    });
    const caller = createAppRouter({
      commandBus: { execute } as never,
      queryBus: { execute: jest.fn() } as never,
    }).createCaller(anonymous);

    await caller.protototo.submitEntry({
      roundId: '33333333-3333-4333-8333-333333333333',
      firstName: 'Ada',
      email: ' ADA@Example.COM ',
      paymentClaimed: true,
      predictions: [
        {
          matchId: '44444444-4444-4444-8444-444444444444',
          setWinners: [true, true, true],
        },
      ],
    });

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: null, email: 'ADA@Example.COM' }),
    );
  });

  it('keeps standings member-only', async () => {
    const appRouter = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn().mockResolvedValue([]) } as never,
    });
    await expect(
      appRouter.createCaller(anonymous).protototo.standings({
        roundId: '33333333-3333-4333-8333-333333333333',
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(
      appRouter.createCaller(member).protototo.standings({
        roundId: '33333333-3333-4333-8333-333333333333',
      }),
    ).resolves.toEqual([]);
  });

  it('keeps round administration admin-only', async () => {
    const caller = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn() } as never,
    }).createCaller(member);
    await expect(caller.protototo.admin.listRounds()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
