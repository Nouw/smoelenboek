import { Pool } from 'pg';

type BetterAuthModule = typeof import('better-auth');
type ApiKeyModule = typeof import('@better-auth/api-key');
type NodeIntegrationModule = typeof import('better-auth/node');

export type BetterAuthInstance = {
  handler: (request: Request) => Promise<Response>;
  $context: Promise<{
    password: {
      hash: (password: string) => Promise<string>;
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
  const [{ betterAuth }, { apiKey }] = await Promise.all([
    importEsm<BetterAuthModule>('better-auth'),
    importEsm<ApiKeyModule>('@better-auth/api-key'),
  ]);

  return betterAuth({
    baseURL: readRequiredEnv('BETTER_AUTH_URL'),
    secret: readRequiredEnv('BETTER_AUTH_SECRET'),
    trustedOrigins: [readRequiredEnv('WEB_ORIGIN')],
    database: new Pool({
      connectionString: readRequiredEnv('DATABASE_URL'),
    }),
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
    },
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
    plugins: [apiKey()],
  }) as BetterAuthInstance;
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
