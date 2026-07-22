import { Pool } from 'pg';

import {
  claimPasswordMigrationReset,
  completePasswordMigration,
  releasePasswordMigrationResetClaim,
  verifyPasswordWithLegacySupport,
} from './legacy-password-migration';
import {
  createConsolePasswordResetMailer,
  type PasswordResetMailer,
} from './password-reset-mailer';

type BetterAuthModule = typeof import('better-auth');
type ApiKeyModule = typeof import('@better-auth/api-key');
type NodeIntegrationModule = typeof import('better-auth/node');
type BetterAuthPluginsModule = typeof import('better-auth/plugins');
type BetterAuthApiModule = typeof import('better-auth/api');
type BetterAuthCookiesModule = typeof import('better-auth/cookies');
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
  const [
    { betterAuth },
    { apiKey },
    { admin },
    { createAuthMiddleware },
    { deleteSessionCookie },
    { generateRandomString, verifyPassword },
  ] = await Promise.all([
    importEsm<BetterAuthModule>('better-auth'),
    importEsm<ApiKeyModule>('@better-auth/api-key'),
    importEsm<BetterAuthPluginsModule>('better-auth/plugins'),
    importEsm<BetterAuthApiModule>('better-auth/api'),
    importEsm<BetterAuthCookiesModule>('better-auth/cookies'),
    importEsm<BetterAuthCryptoModule>('better-auth/crypto'),
  ]);
  const database = new Pool({
    connectionString: readRequiredEnv('DATABASE_URL'),
  });
  const webOrigin = readRequiredEnv('WEB_ORIGIN');
  const passwordResetMailer = createConsolePasswordResetMailer();

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
        passwordMigrationResetSentAt: {
          type: 'date',
          required: false,
          input: false,
        },
      },
      changeEmail: {
        enabled: true,
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        console.log(
          `[email-verification] To: ${user.email}\n            URL: ${url}`,
        );
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
      onPasswordReset: ({ user }) =>
        completePasswordMigration(database, user.id),
      revokeSessionsOnPasswordReset: true,
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/sign-in/email') {
          return;
        }

        const session = ctx.context.newSession;
        if (!session?.user.passwordMigrationRequired) {
          return;
        }

        try {
          await sendMigrationResetIfDue({
            ctx,
            database,
            mailer: passwordResetMailer,
            webOrigin,
            generateToken: () => generateRandomString(32),
          });
        } finally {
          deleteSessionCookie(ctx, true);
          await ctx.context.internalAdapter.deleteSession(
            session.session.token,
          );
          ctx.context.setNewSession(null);
        }
      }),
    },
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
    plugins: createBetterAuthPlugins(apiKey, admin),
  }) as unknown as BetterAuthInstance;
}

type MigrationResetContext = {
  context: {
    baseURL: string;
    newSession: {
      user: { id: string; email: string; name: string };
    } | null;
    internalAdapter: {
      createVerificationValue(input: {
        identifier: string;
        value: string;
        expiresAt: Date;
      }): Promise<unknown>;
    };
  };
};

export async function sendMigrationResetIfDue(options: {
  ctx: MigrationResetContext;
  database: Pick<Pool, 'query'>;
  mailer: PasswordResetMailer;
  webOrigin: string;
  generateToken: () => string;
  now?: Date;
}): Promise<boolean> {
  const session = options.ctx.context.newSession;
  if (!session) {
    return false;
  }

  const claimedAt = options.now ?? new Date();
  const claimed = await claimPasswordMigrationReset(
    options.database,
    session.user.id,
    claimedAt,
  );
  if (!claimed) {
    return false;
  }

  try {
    const token = options.generateToken();
    await options.ctx.context.internalAdapter.createVerificationValue({
      identifier: `reset-password:${token}`,
      value: session.user.id,
      expiresAt: new Date(claimedAt.getTime() + 60 * 60 * 1000),
    });
    const callbackUrl = new URL(
      '/reset-password',
      options.webOrigin,
    ).toString();
    const url = `${options.ctx.context.baseURL}/reset-password/${token}?callbackURL=${encodeURIComponent(callbackUrl)}`;
    await options.mailer.send({ user: session.user, url, token });
    return true;
  } catch (error) {
    await releasePasswordMigrationResetClaim(
      options.database,
      session.user.id,
      claimedAt,
    );
    throw error;
  }
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
