import { Pool } from 'pg';

import {
  type BetterAuthInstance,
  createAdminBetterAuth,
} from '../auth/better-auth-instance';
import { loadRpcEnv } from '../config/env';
import {
  INSERT_CREDENTIAL_ACCOUNT_SQL,
  createCredentialAccountValues,
} from './credential-account';
import { parseCreateUserArgs } from './create-user-options';

type SignUpEmailResult = {
  user?: AdminUser;
};

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
};

async function main(): Promise<void> {
  loadRpcEnv();

  const options = parseCreateUserArgs(process.argv.slice(2));
  const auth = await createAdminBetterAuth();
  const user = await createUserWithCredential(auth, options);

  console.log(
    JSON.stringify(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ?? options.role,
      },
      null,
      2,
    ),
  );
}

async function createUserWithCredential(
  auth: BetterAuthInstance,
  options: { email: string; password: string; name: string; role: string },
): Promise<AdminUser> {
  try {
    const result = (await auth.api.createUser({
      body: {
        email: options.email,
        password: options.password,
        name: options.name,
        role: options.role,
      },
    })) as SignUpEmailResult;

    if (!result.user) {
      throw new Error('Better Auth did not return a created user.');
    }

    return result.user;
  } catch (error) {
    if (!isExistingUserError(error)) {
      throw error;
    }

    return attachMissingCredentialAccount(auth, options);
  }
}

async function attachMissingCredentialAccount(
  auth: BetterAuthInstance,
  options: { email: string; password: string; role: string },
): Promise<AdminUser> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const user = await findUserByEmail(pool, options.email);

    if (!user) {
      throw new Error(
        'Better Auth reported an existing user, but no matching user row was found.',
      );
    }

    if (await hasCredentialAccount(pool, user.id)) {
      throw new Error('User already exists and already has a credential account.');
    }

    const context = await auth.$context;
    const passwordHash = await context.password.hash(options.password);

    await pool.query(
      INSERT_CREDENTIAL_ACCOUNT_SQL,
      createCredentialAccountValues(user.id, passwordHash),
    );
    await pool.query('UPDATE "users" SET "role" = $1 WHERE "id" = $2', [
      options.role,
      user.id,
    ]);

    return user;
  } finally {
    await pool.end();
  }
}

async function findUserByEmail(
  pool: Pool,
  email: string,
): Promise<AdminUser | null> {
  const result = await pool.query<AdminUser>(
      `
        SELECT "id", "email", "name", "role"
        FROM "users"
        WHERE lower("email") = lower($1)
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

async function hasCredentialAccount(
  pool: Pool,
  userId: string,
): Promise<boolean> {
  const result = await pool.query<{ id: string }>(
    `
      SELECT "id"
      FROM "account"
      WHERE "userId" = $1 AND "providerId" = 'credential'
      LIMIT 1
    `,
    [userId],
  );

  return (result.rowCount ?? 0) > 0;
}

function isExistingUserError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return message.toLowerCase().includes('user already exists');
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to create user: ${message}`);
  process.exitCode = 1;
});
