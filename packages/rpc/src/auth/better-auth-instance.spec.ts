import { describe, expect, it, jest } from '@jest/globals';

import {
  createBetterAuthPlugins,
  sendMigrationResetIfDue,
} from './better-auth-instance';

describe('createBetterAuthPlugins', () => {
  it('installs the api key and admin plugins', () => {
    expect(
      createBetterAuthPlugins(
        () => 'api-key',
        () => 'admin',
      ),
    ).toEqual(['api-key', 'admin']);
  });
});

describe('sendMigrationResetIfDue', () => {
  it('creates and delivers one Better Auth reset token after claiming delivery', async () => {
    const query = jest.fn(async () => ({ rowCount: 1 }));
    const createVerificationValue = jest.fn(async () => undefined);
    const send = jest.fn(async () => undefined);
    const now = new Date('2026-07-22T10:00:00.000Z');

    await expect(
      sendMigrationResetIfDue({
        ctx: {
          context: {
            baseURL: 'https://auth.example.com/api/auth',
            newSession: {
              user: {
                id: 'user-id',
                email: 'member@example.com',
                name: 'Member',
              },
            },
            internalAdapter: { createVerificationValue },
          },
        },
        database: { query } as never,
        mailer: { send },
        webOrigin: 'https://members.example.com',
        generateToken: () => 'reset-token',
        now,
      }),
    ).resolves.toBe(true);

    expect(createVerificationValue).toHaveBeenCalledWith({
      identifier: 'reset-password:reset-token',
      value: 'user-id',
      expiresAt: new Date('2026-07-22T11:00:00.000Z'),
    });
    expect(send).toHaveBeenCalledWith({
      user: {
        id: 'user-id',
        email: 'member@example.com',
        name: 'Member',
      },
      token: 'reset-token',
      url: 'https://auth.example.com/api/auth/reset-password/reset-token?callbackURL=https%3A%2F%2Fmembers.example.com%2Freset-password',
    });
  });

  it('does not generate another reset during the cooldown', async () => {
    const createVerificationValue = jest.fn(async () => undefined);
    const send = jest.fn(async () => undefined);

    await expect(
      sendMigrationResetIfDue({
        ctx: {
          context: {
            baseURL: 'https://auth.example.com/api/auth',
            newSession: {
              user: {
                id: 'user-id',
                email: 'member@example.com',
                name: 'Member',
              },
            },
            internalAdapter: { createVerificationValue },
          },
        },
        database: {
          query: jest.fn(async () => ({ rowCount: 0 })),
        } as never,
        mailer: { send },
        webOrigin: 'https://members.example.com',
        generateToken: () => 'reset-token',
      }),
    ).resolves.toBe(false);

    expect(createVerificationValue).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
