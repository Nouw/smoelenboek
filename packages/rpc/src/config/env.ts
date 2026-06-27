import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type RpcEnv = {
  DATABASE_URL: string;
  CLERK_SECRET_KEY: string;
  WEB_ORIGIN: string;
  PORT: string;
};

export const rpcEnvFilePath = join(__dirname, '..', '..', '.env.local');

export function loadRpcEnv(): void {
  if (existsSync(rpcEnvFilePath)) {
    loadDotenv({ path: rpcEnvFilePath, quiet: true });
  }
}

export function validateRpcEnv(config: Record<string, unknown>): RpcEnv {
  const databaseUrl = readRequiredString(config, 'DATABASE_URL');
  const clerkSecretKey = readRequiredString(config, 'CLERK_SECRET_KEY');
  const webOrigin = readOptionalString(
    config,
    'WEB_ORIGIN',
    'http://localhost:3001',
  );
  const port = readOptionalString(config, 'PORT', '3002');

  if (!Number.isInteger(Number(port)) || Number(port) <= 0) {
    throw new Error('PORT must be a positive integer.');
  }

  return {
    DATABASE_URL: databaseUrl,
    CLERK_SECRET_KEY: clerkSecretKey,
    WEB_ORIGIN: webOrigin,
    PORT: port,
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
