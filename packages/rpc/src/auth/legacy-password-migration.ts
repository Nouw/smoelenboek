import { compare } from 'bcryptjs';
import type { Pool } from 'pg';

export const LEGACY_BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;
export const PASSWORD_RESET_COOLDOWN_MS = 15 * 60 * 1000;

export function isLegacyBcryptHash(hash: string): boolean {
  return LEGACY_BCRYPT_PATTERN.test(hash);
}

export async function verifyPasswordWithLegacySupport(
  password: string,
  hash: string,
  verifyModern: (input: { password: string; hash: string }) => Promise<boolean>,
): Promise<boolean> {
  if (isLegacyBcryptHash(hash)) {
    return compare(password, hash);
  }

  return verifyModern({ password, hash });
}

export async function claimPasswordMigrationReset(
  pool: Pick<Pool, 'query'>,
  userId: string,
  now: Date = new Date(),
  cooldownMs: number = PASSWORD_RESET_COOLDOWN_MS,
): Promise<boolean> {
  const result = await pool.query(
    `
      UPDATE "users"
      SET "passwordMigrationResetSentAt" = $2,
          "updatedAt" = now()
      WHERE "id" = $1
        AND "passwordMigrationRequired" = true
        AND (
          "passwordMigrationResetSentAt" IS NULL
          OR "passwordMigrationResetSentAt" <= $3
        )
      RETURNING "id"
    `,
    [userId, now, new Date(now.getTime() - cooldownMs)],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function releasePasswordMigrationResetClaim(
  pool: Pick<Pool, 'query'>,
  userId: string,
  claimedAt: Date,
): Promise<void> {
  await pool.query(
    `
      UPDATE "users"
      SET "passwordMigrationResetSentAt" = NULL,
          "updatedAt" = now()
      WHERE "id" = $1
        AND "passwordMigrationRequired" = true
        AND "passwordMigrationResetSentAt" = $2
    `,
    [userId, claimedAt],
  );
}

export async function completePasswordMigration(
  pool: Pick<Pool, 'query'>,
  userId: string,
): Promise<void> {
  await pool.query(
    `
      UPDATE "users"
      SET "passwordMigrationRequired" = false,
          "passwordMigrationResetSentAt" = NULL,
          "updatedAt" = now()
      WHERE "id" = $1
    `,
    [userId],
  );
}
