import { compare } from 'bcryptjs';
import type { Pool } from 'pg';

export const LEGACY_BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;
export const LEGACY_RESET_PASSWORD = 'reset';

export function isLegacyBcryptHash(hash: string): boolean {
  return LEGACY_BCRYPT_PATTERN.test(hash);
}

export function isLegacyResetPassword(hash: string): boolean {
  return hash === LEGACY_RESET_PASSWORD;
}

export async function verifyPasswordWithLegacySupport(
  password: string,
  hash: string,
  verifyModern: (input: { password: string; hash: string }) => Promise<boolean>,
): Promise<boolean> {
  if (isLegacyResetPassword(hash)) {
    return false;
  }

  if (isLegacyBcryptHash(hash)) {
    return compare(password, hash);
  }

  return verifyModern({ password, hash });
}

export async function completePasswordMigration(
  pool: Pick<Pool, 'query'>,
  userId: string,
): Promise<void> {
  await pool.query(
    `
      UPDATE "users"
      SET "passwordMigrationRequired" = false,
          "updatedAt" = now()
      WHERE "id" = $1
    `,
    [userId],
  );
}
