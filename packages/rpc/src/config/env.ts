import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type RpcEnv = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  WEB_ORIGIN: string;
  PORT: string;
  OCI_REGION: string;
  OCI_TENANCY_OCID: string;
  OCI_USER_OCID: string;
  OCI_FINGERPRINT: string;
  OCI_PRIVATE_KEY: string;
  OCI_PRIVATE_KEY_PASSPHRASE?: string;
  OCI_OBJECT_STORAGE_NAMESPACE: string;
  OCI_OBJECT_STORAGE_BUCKET: string;
  OCI_OBJECT_STORAGE_PUBLIC_BASE_URL?: string;
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
  const ociObjectStoragePublicBaseUrl = readOptionalString(
    config,
    'OCI_OBJECT_STORAGE_PUBLIC_BASE_URL',
    '',
  );

  if (!Number.isInteger(Number(port)) || Number(port) <= 0) {
    throw new Error('PORT must be a positive integer.');
  }

  return {
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: betterAuthSecret,
    BETTER_AUTH_URL: betterAuthUrl,
    WEB_ORIGIN: webOrigin,
    PORT: port,
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
    ...(ociObjectStoragePublicBaseUrl
      ? { OCI_OBJECT_STORAGE_PUBLIC_BASE_URL: ociObjectStoragePublicBaseUrl }
      : {}),
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
