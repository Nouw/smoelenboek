import { Pool } from 'pg';

import { createAdminBetterAuth } from '../auth/better-auth-instance';
import { loadRpcEnv } from '../config/env';
import { parseCreateApiKeyArgs } from './create-api-key-options';

type CreateApiKeyResult = {
  id: string;
  key: string;
  name?: string | null;
  prefix?: string | null;
  start?: string | null;
  enabled: boolean;
  expiresAt?: Date | string | null;
  referenceId: string;
  metadata?: unknown;
  rateLimitEnabled: boolean;
  rateLimitMax?: number | null;
  rateLimitTimeWindow?: number | null;
  remaining?: number | null;
};

type UserRow = {
  id: string;
  email: string;
};

async function main(): Promise<void> {
  loadRpcEnv();

  const options = parseCreateApiKeyArgs(process.argv.slice(2));
  const userId = options.userId ?? (await resolveUserIdByEmail(options.email));
  const auth = await createAdminBetterAuth();

  const result = (await auth.api.createApiKey({
    body: {
      userId,
      name: options.name,
      prefix: options.prefix,
      expiresIn: options.expiresIn,
      metadata: options.metadata,
      rateLimitEnabled: options.rateLimitEnabled,
      rateLimitMax: options.rateLimitMax,
      rateLimitTimeWindow: options.rateLimitTimeWindow,
      remaining: options.remaining,
    },
  })) as CreateApiKeyResult;

  console.log(
    JSON.stringify(
      {
        id: result.id,
        key: result.key,
        name: result.name,
        prefix: result.prefix,
        start: result.start,
        enabled: result.enabled,
        expiresAt: result.expiresAt,
        referenceId: result.referenceId,
        metadata: result.metadata,
        rateLimitEnabled: result.rateLimitEnabled,
        rateLimitMax: result.rateLimitMax,
        rateLimitTimeWindow: result.rateLimitTimeWindow,
        remaining: result.remaining,
      },
      null,
      2,
    ),
  );
}

async function resolveUserIdByEmail(email: string | undefined): Promise<string> {
  if (!email) {
    throw new Error('Either --email or --user-id is required.');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query<UserRow>(
      `
        SELECT "id", "email"
        FROM "users"
        WHERE lower("email") = lower($1)
        LIMIT 1
      `,
      [email],
    );
    const user = result.rows[0];

    if (!user) {
      throw new Error(`No user found for email ${email}.`);
    }

    return user.id;
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to create API key: ${message}`);
  process.exitCode = 1;
});
