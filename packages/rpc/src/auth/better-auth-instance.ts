import { Pool } from 'pg';

import {
  completePasswordMigration,
  verifyPasswordWithLegacySupport,
} from './legacy-password-migration';
import {
  createOutboxPasswordResetMailer,
  queueAuthEmail,
} from './password-reset-mailer';

type BetterAuthModule = typeof import('better-auth');
type ApiKeyModule = typeof import('@better-auth/api-key');
type NodeIntegrationModule = typeof import('better-auth/node');
type BetterAuthPluginsModule = typeof import('better-auth/plugins');
type BetterAuthCryptoModule = typeof import('better-auth/crypto');

export type BetterAuthInstance = {
  handler: (request: Request) => Promise<Response>;
  $context: Promise<{
    password: {
      hash: (password: string) => Promise<string>;
      verify: (input: { password: string; hash: string }) => Promise<boolean>;
    };
  }>;
  api: {
    getSession: (context: { headers: Headers }) => Promise<unknown>;
    signUpEmail: (context: {
      body: {
        email: string;
        password: string;
        name: string;
      };
    }) => Promise<unknown>;
    createUser: (context: {
      body: {
        email: string;
        password: string;
        name: string;
        role?: string | string[];
      };
    }) => Promise<unknown>;
    verifyApiKey: (context: { body: { key: string } }) => Promise<unknown>;
    createApiKey: (context: {
      body: {
        userId: string;
        name?: string;
        prefix?: string;
        expiresIn?: number;
        metadata?: unknown;
        rateLimitEnabled?: boolean;
        rateLimitMax?: number;
        rateLimitTimeWindow?: number;
        remaining?: number;
      };
    }) => Promise<unknown>;
    setRole: (context: {
      body: {
        userId: string;
        role: string | string[];
      };
      headers?: Headers;
    }) => Promise<unknown>;
    removeUser: (context: { body: { userId: string } }) => Promise<unknown>;
  };
};
export type BetterAuthNodeHandler = ReturnType<
  NodeIntegrationModule['toNodeHandler']
>;

let authPromise: Promise<BetterAuthInstance> | null = null;
let nodeHandlerPromise: Promise<BetterAuthNodeHandler> | null = null;

export function getBetterAuth(): Promise<BetterAuthInstance> {
  authPromise ??= createBetterAuth({ disableSignUp: true });
  return authPromise;
}

export function createAdminBetterAuth(): Promise<BetterAuthInstance> {
  return createBetterAuth({ disableSignUp: false });
}

export async function getBetterAuthNodeHandler(): Promise<BetterAuthNodeHandler> {
  nodeHandlerPromise ??= Promise.all([
    getBetterAuth(),
    importEsm<NodeIntegrationModule>('better-auth/node'),
  ]).then(([auth, { toNodeHandler }]) => toNodeHandler(auth.handler));

  return nodeHandlerPromise;
}

async function createBetterAuth(options: {
  disableSignUp: boolean;
}): Promise<BetterAuthInstance> {
  const [{ betterAuth }, { apiKey }, { admin }, { verifyPassword }] =
    await Promise.all([
      importEsm<BetterAuthModule>('better-auth'),
      importEsm<ApiKeyModule>('@better-auth/api-key'),
      importEsm<BetterAuthPluginsModule>('better-auth/plugins'),
      importEsm<BetterAuthCryptoModule>('better-auth/crypto'),
    ]);
  const database = new Pool({
    connectionString: readRequiredEnv('DATABASE_URL'),
  });
  const webOrigin = readRequiredEnv('WEB_ORIGIN');
  const passwordResetMailer = createOutboxPasswordResetMailer(database);

  return betterAuth({
    baseURL: readRequiredEnv('BETTER_AUTH_URL'),
    secret: readRequiredEnv('BETTER_AUTH_SECRET'),
    trustedOrigins: [webOrigin],
    database,
    user: {
      modelName: 'users',
      fields: {
        image: 'imageUrl',
      },
      additionalFields: {
        firstName: {
          type: 'string',
          required: false,
          input: false,
        },
        lastName: {
          type: 'string',
          required: false,
          input: false,
        },
        passwordMigrationRequired: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          input: false,
        },
        preferredLocale: {
          type: 'string',
          required: false,
          defaultValue: 'nl',
          input: false,
        },
      },
      changeEmail: {
        enabled: true,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await queueAuthEmail(database, 'email_verification', user, url);
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: options.disableSignUp,
      password: {
        verify: ({ password, hash }) =>
          verifyPasswordWithLegacySupport(password, hash, verifyPassword),
      },
      sendResetPassword: (message) => passwordResetMailer.send(message),
      onPasswordReset: async ({ user }) => {
        await Promise.all([
          completePasswordMigration(database, user.id),
          database.query(
            `UPDATE "users" SET "accountActivatedAt" = COALESCE("accountActivatedAt", now()), "updatedAt" = now() WHERE "id" = $1`,
            [user.id],
          ),
        ]);
      },
      revokeSessionsOnPasswordReset: true,
    },
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
    plugins: createBetterAuthPlugins(apiKey, admin),
  }) as unknown as BetterAuthInstance;
}

export function createBetterAuthPlugins<TApiKeyPlugin, TAdminPlugin>(
  apiKey: () => TApiKeyPlugin,
  admin: () => TAdminPlugin,
): [TApiKeyPlugin, TAdminPlugin] {
  return [apiKey(), admin()];
}

function readRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is required for Better Auth.`);
  }

  return value;
}

function importEsm<T>(specifier: string): Promise<T> {
  const dynamicImport = new Function(
    'specifier',
    'return import(specifier)',
  ) as (specifier: string) => Promise<T>;

  return dynamicImport(specifier);
}
