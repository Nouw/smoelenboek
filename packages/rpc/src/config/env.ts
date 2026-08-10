import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type RpcEnv = {
  NODE_ENV: 'development' | 'test' | 'production';
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  WEB_ORIGIN: string;
  PORT: string;
  NEVOBO_BASE_URL: string;
  NEVOBO_ASSOCIATION_ID: string;
  PROTOTOTO_SYNC_INTERVAL_MS: string;
  OCI_REGION: string;
  OCI_TENANCY_OCID: string;
  OCI_USER_OCID: string;
  OCI_FINGERPRINT: string;
  OCI_PRIVATE_KEY: string;
  OCI_PRIVATE_KEY_PASSPHRASE?: string;
  OCI_OBJECT_STORAGE_NAMESPACE: string;
  OCI_OBJECT_STORAGE_BUCKET: string;
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_SECURE: boolean;
  MAIL_REQUIRE_TLS: boolean;
  MAIL_REJECT_UNAUTHORIZED: boolean;
  MAIL_FROM: string;
  MAIL_USER?: string;
  MAIL_PASSWORD?: string;
  MAIL_VERIFY_ON_STARTUP: boolean;
  MAIL_CONNECTION_TIMEOUT_MS: number;
  MAIL_GREETING_TIMEOUT_MS: number;
  MAIL_SOCKET_TIMEOUT_MS: number;
};

export const rpcEnvFilePath = join(__dirname, '..', '..', '.env.local');

export function loadRpcEnv(): void {
  if (existsSync(rpcEnvFilePath)) {
    loadDotenv({ path: rpcEnvFilePath, quiet: true });
  }
}

export function validateRpcEnv(config: Record<string, unknown>): RpcEnv {
  const nodeEnv = readNodeEnv(config);
  const production = nodeEnv === 'production';
  const databaseUrl = readRequiredString(config, 'DATABASE_URL');
  const betterAuthSecret = readRequiredString(config, 'BETTER_AUTH_SECRET');
  const betterAuthUrl = readRequiredString(config, 'BETTER_AUTH_URL');
  const webOrigin = readOptionalString(
    config,
    'WEB_ORIGIN',
    'http://localhost:3001',
  );
  const port = readOptionalString(config, 'PORT', '3002');
  const nevoboBaseUrl = readOptionalString(
    config,
    'NEVOBO_BASE_URL',
    'https://api.nevobo.nl',
  );
  const nevoboAssociationId = readOptionalString(
    config,
    'NEVOBO_ASSOCIATION_ID',
    'ckl9y0t',
  );
  const protototoSyncIntervalMs = readOptionalString(
    config,
    'PROTOTOTO_SYNC_INTERVAL_MS',
    '900000',
  );
  const ociRegion = readRequiredString(config, 'OCI_REGION');
  const ociTenancyOcid = readRequiredString(config, 'OCI_TENANCY_OCID');
  const ociUserOcid = readRequiredString(config, 'OCI_USER_OCID');
  const ociFingerprint = readRequiredString(config, 'OCI_FINGERPRINT');
  const ociPrivateKey = readRequiredString(config, 'OCI_PRIVATE_KEY');
  const ociPrivateKeyPassphrase = readOptionalString(
    config,
    'OCI_PRIVATE_KEY_PASSPHRASE',
    '',
  );
  const ociObjectStorageNamespace = readRequiredString(
    config,
    'OCI_OBJECT_STORAGE_NAMESPACE',
  );
  const ociObjectStorageBucket = readRequiredString(
    config,
    'OCI_OBJECT_STORAGE_BUCKET',
  );
  const mailHost = production
    ? readProductionString(config, 'MAIL_HOST')
    : readOptionalString(config, 'MAIL_HOST', '127.0.0.1');
  const mailPort = readPositiveInteger(
    config,
    'MAIL_PORT',
    production ? undefined : 1025,
    65_535,
  );
  const mailSecure = readBoolean(config, 'MAIL_SECURE', false);
  const mailRequireTls = readBoolean(
    config,
    'MAIL_REQUIRE_TLS',
    production && !mailSecure,
  );
  const mailRejectUnauthorized = readBoolean(
    config,
    'MAIL_REJECT_UNAUTHORIZED',
    true,
  );
  const mailFrom = production
    ? readProductionString(config, 'MAIL_FROM')
    : readOptionalString(
        config,
        'MAIL_FROM',
        'Smoelenboek <noreply@smoelenboek.local>',
      );
  const mailUser = readOptionalString(config, 'MAIL_USER', '');
  const mailPassword = readOptionalString(config, 'MAIL_PASSWORD', '');

  if (Boolean(mailUser) !== Boolean(mailPassword)) {
    throw new Error('MAIL_USER and MAIL_PASSWORD must be provided together.');
  }
  if (production && (!mailUser || !mailPassword)) {
    throw new Error('SMTP authentication is required in production.');
  }
  if (production && !mailSecure && !mailRequireTls) {
    throw new Error(
      'MAIL_REQUIRE_TLS must be true when MAIL_SECURE is false in production.',
    );
  }
  if (production && !mailRejectUnauthorized) {
    throw new Error('MAIL_REJECT_UNAUTHORIZED cannot be false in production.');
  }
  assertValidMailbox(mailFrom, 'MAIL_FROM');
  if (!Number.isInteger(Number(port)) || Number(port) <= 0) {
    throw new Error('PORT must be a positive integer.');
  }
  if (
    !Number.isInteger(Number(protototoSyncIntervalMs)) ||
    Number(protototoSyncIntervalMs) < 60000
  ) {
    throw new Error('PROTOTOTO_SYNC_INTERVAL_MS must be at least 60000.');
  }

  return {
    NODE_ENV: nodeEnv,
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: betterAuthSecret,
    BETTER_AUTH_URL: betterAuthUrl,
    WEB_ORIGIN: webOrigin,
    PORT: port,
    NEVOBO_BASE_URL: nevoboBaseUrl,
    NEVOBO_ASSOCIATION_ID: nevoboAssociationId,
    PROTOTOTO_SYNC_INTERVAL_MS: protototoSyncIntervalMs,
    OCI_REGION: ociRegion,
    OCI_TENANCY_OCID: ociTenancyOcid,
    OCI_USER_OCID: ociUserOcid,
    OCI_FINGERPRINT: ociFingerprint,
    OCI_PRIVATE_KEY: ociPrivateKey,
    ...(ociPrivateKeyPassphrase
      ? { OCI_PRIVATE_KEY_PASSPHRASE: ociPrivateKeyPassphrase }
      : {}),
    OCI_OBJECT_STORAGE_NAMESPACE: ociObjectStorageNamespace,
    OCI_OBJECT_STORAGE_BUCKET: ociObjectStorageBucket,
    MAIL_HOST: mailHost,
    MAIL_PORT: mailPort,
    MAIL_SECURE: mailSecure,
    MAIL_REQUIRE_TLS: mailRequireTls,
    MAIL_REJECT_UNAUTHORIZED: mailRejectUnauthorized,
    MAIL_FROM: mailFrom,
    ...(mailUser ? { MAIL_USER: mailUser, MAIL_PASSWORD: mailPassword } : {}),
    MAIL_VERIFY_ON_STARTUP: production,
    MAIL_CONNECTION_TIMEOUT_MS: readPositiveInteger(
      config,
      'MAIL_CONNECTION_TIMEOUT_MS',
      10_000,
    ),
    MAIL_GREETING_TIMEOUT_MS: readPositiveInteger(
      config,
      'MAIL_GREETING_TIMEOUT_MS',
      10_000,
    ),
    MAIL_SOCKET_TIMEOUT_MS: readPositiveInteger(
      config,
      'MAIL_SOCKET_TIMEOUT_MS',
      60_000,
    ),
  };
}

function readNodeEnv(config: Record<string, unknown>): RpcEnv['NODE_ENV'] {
  const value = readOptionalString(config, 'NODE_ENV', 'development');
  if (!['development', 'test', 'production'].includes(value)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  return value as RpcEnv['NODE_ENV'];
}

function readProductionString(
  config: Record<string, unknown>,
  key: keyof RpcEnv,
): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is required in production.`);
  }
  return value.trim();
}

function readBoolean(
  config: Record<string, unknown>,
  key: keyof RpcEnv,
  fallback: boolean,
): boolean {
  const value = config[key];
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${key} must be true or false.`);
}

function readPositiveInteger(
  config: Record<string, unknown>,
  key: keyof RpcEnv,
  fallback?: number,
  maximum = 2_147_483_647,
): number {
  const value = config[key];
  if ((value === undefined || value === null || value === '') && fallback) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }
  if (number > maximum) {
    throw new Error(`${key} must be between 1 and ${maximum}.`);
  }
  return number;
}

function assertValidMailbox(value: string, key: keyof RpcEnv): void {
  const match = /^(?:[^<>]*<)?([^<>\s]+@[^<>\s]+)(?:>)?$/.exec(value.trim());
  if (!match || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(match[1] ?? '')) {
    throw new Error(`${key} must contain a valid email address.`);
  }
}

function readRequiredString(
  config: Record<string, unknown>,
  key: keyof RpcEnv,
): string {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is required for packages/rpc.`);
  }

  return value;
}

function readOptionalString(
  config: Record<string, unknown>,
  key: keyof RpcEnv,
  fallback: string,
): string {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  return value;
}
