import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type RpcEnv = {
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
};

export const rpcEnvFilePath = join(__dirname, '..', '..', '.env.local');

export function loadRpcEnv(): void {
  if (existsSync(rpcEnvFilePath)) {
    loadDotenv({ path: rpcEnvFilePath, quiet: true });
  }
}

export function validateRpcEnv(config: Record<string, unknown>): RpcEnv {
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
  };
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
