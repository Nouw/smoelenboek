import { describe, expect, it, jest } from '@jest/globals';
import { hashSync } from 'bcryptjs';

import {
  completePasswordMigration,
  isLegacyBcryptHash,
  isLegacyResetPassword,
  verifyPasswordWithLegacySupport,
} from './legacy-password-migration';

describe('legacy password migration', () => {
  it('recognizes supported bcrypt variants and rejects modern hashes', () => {
    expect(isLegacyBcryptHash('$2a$10$abcdefghijklmnopqrstuvwxyz')).toBe(true);
    expect(isLegacyBcryptHash('$2b$12$abcdefghijklmnopqrstuvwxyz')).toBe(true);
    expect(isLegacyBcryptHash('$2y$08$abcdefghijklmnopqrstuvwxyz')).toBe(true);
    expect(isLegacyBcryptHash('scrypt:modern-password-hash')).toBe(false);
  });

  it('recognizes the legacy reset sentinel', () => {
    expect(isLegacyResetPassword('reset')).toBe(true);
    expect(isLegacyResetPassword('$2b$10$hash')).toBe(false);
  });

  it('rejects the reset sentinel without passing it to the scrypt verifier', async () => {
    const verifyModern = jest.fn<() => Promise<boolean>>();

    await expect(
      verifyPasswordWithLegacySupport('reset', 'reset', verifyModern),
    ).resolves.toBe(false);
    expect(verifyModern).not.toHaveBeenCalled();
  });

  it('verifies bcrypt hashes without invoking the modern verifier', async () => {
    const verifyModern = jest.fn<() => Promise<boolean>>();
    const hash = hashSync('old-password', 4);

    await expect(
      verifyPasswordWithLegacySupport('old-password', hash, verifyModern),
    ).resolves.toBe(true);
    await expect(
      verifyPasswordWithLegacySupport('wrong-password', hash, verifyModern),
    ).resolves.toBe(false);
    expect(verifyModern).not.toHaveBeenCalled();
  });

  it('delegates non-bcrypt hashes to Better Auth', async () => {
    const verifyModern = jest.fn(async () => true);

    await expect(
      verifyPasswordWithLegacySupport(
        'new-password',
        'scrypt:modern-password-hash',
        verifyModern,
      ),
    ).resolves.toBe(true);
    expect(verifyModern).toHaveBeenCalledWith({
      password: 'new-password',
      hash: 'scrypt:modern-password-hash',
    });
  });

  it('clears migration state after Better Auth stores a new password', async () => {
    const query = jest.fn(async () => ({ rowCount: 1 }));
    await completePasswordMigration({ query } as never, 'user-id');

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[1]).toEqual(['user-id']);
  });
});
