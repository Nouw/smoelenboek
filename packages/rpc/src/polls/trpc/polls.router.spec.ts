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
  sessionId: 'session',
  authType: 'session' as const,
  role: 'user',
};

describe('polls tRPC router', () => {
  it('keeps member polls behind authentication', async () => {
    const router = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn().mockResolvedValue([]) } as never,
    });
    await expect(
      router.createCaller(anonymous).polls.list(),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    await expect(router.createCaller(member).polls.list()).resolves.toEqual([]);
  });

  it('keeps poll administration behind the admin role', async () => {
    const router = createAppRouter({
      commandBus: { execute: jest.fn() } as never,
      queryBus: { execute: jest.fn().mockResolvedValue([]) } as never,
    });
    await expect(
      router.createCaller(member).polls.admin.list(),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(
      router.createCaller({ ...member, role: 'admin' }).polls.admin.list(),
    ).resolves.toEqual([]);
  });
});
