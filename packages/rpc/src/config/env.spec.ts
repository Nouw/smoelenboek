import { describe, expect, it } from '@jest/globals';

import { validateRpcEnv } from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
  BETTER_AUTH_SECRET: 'better-auth-secret-with-32-characters',
  BETTER_AUTH_URL: 'http://localhost:3002',
  OCI_REGION: 'eu-amsterdam-1',
  OCI_TENANCY_OCID: 'ocid1.tenancy.oc1..example',
  OCI_USER_OCID: 'ocid1.user.oc1..example',
  OCI_FINGERPRINT: '00:11:22:33',
  OCI_PRIVATE_KEY:
    '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----',
  OCI_OBJECT_STORAGE_NAMESPACE: 'namespace',
  OCI_OBJECT_STORAGE_BUCKET: 'bucket',
};

describe('validateRpcEnv', () => {
  it('refuses to start production without an explicit SMTP host', () => {
    expect(() =>
      validateRpcEnv({
        ...validEnv,
        NODE_ENV: 'production',
        MAIL_HOST: undefined,
        MAIL_PORT: '587',
        MAIL_FROM: 'Smoelenboek <members@example.com>',
        MAIL_USER: 'smtp-user',
        MAIL_PASSWORD: 'smtp-password',
      }),
    ).toThrow('MAIL_HOST is required in production.');
  });

  it('requires complete SMTP authentication credentials', () => {
    expect(() =>
      validateRpcEnv({
        ...validEnv,
        MAIL_USER: 'smtp-user',
        MAIL_PASSWORD: undefined,
      }),
    ).toThrow('MAIL_USER and MAIL_PASSWORD must be provided together.');

    expect(() =>
      validateRpcEnv({
        ...productionMailEnv,
        MAIL_USER: undefined,
        MAIL_PASSWORD: undefined,
      }),
    ).toThrow('SMTP authentication is required in production.');
  });

  it('enforces authenticated TLS with certificate checks in production', () => {
    expect(() =>
      validateRpcEnv({
        ...productionMailEnv,
        MAIL_REQUIRE_TLS: 'false',
      }),
    ).toThrow(
      'MAIL_REQUIRE_TLS must be true when MAIL_SECURE is false in production.',
    );
    expect(() =>
      validateRpcEnv({
        ...productionMailEnv,
        MAIL_REJECT_UNAUTHORIZED: 'false',
      }),
    ).toThrow('MAIL_REJECT_UNAUTHORIZED cannot be false in production.');
  });

  it('rejects invalid sender addresses and malformed SMTP settings', () => {
    expect(() =>
      validateRpcEnv({ ...validEnv, MAIL_FROM: 'not-an-email' }),
    ).toThrow('MAIL_FROM must contain a valid email address.');
    expect(() =>
      validateRpcEnv({ ...validEnv, MAIL_PORT: 'not-a-port' }),
    ).toThrow('MAIL_PORT must be a positive integer.');
    expect(() =>
      validateRpcEnv({ ...validEnv, MAIL_PORT: '70000' }),
    ).toThrow('MAIL_PORT must be between 1 and 65535.');
    expect(() =>
      validateRpcEnv({ ...validEnv, MAIL_SECURE: 'sometimes' }),
    ).toThrow('MAIL_SECURE must be true or false.');
  });

  it('returns production SMTP settings for the transport adapter', () => {
    expect(validateRpcEnv(productionMailEnv)).toMatchObject({
      NODE_ENV: 'production',
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: 587,
      MAIL_SECURE: false,
      MAIL_REQUIRE_TLS: true,
      MAIL_REJECT_UNAUTHORIZED: true,
      MAIL_FROM: 'Smoelenboek <members@example.com>',
      MAIL_USER: 'smtp-user',
      MAIL_PASSWORD: 'smtp-password',
      MAIL_VERIFY_ON_STARTUP: true,
    });
  });

  it('requires DATABASE_URL', () => {
    expect(() =>
      validateRpcEnv({
        ...validEnv,
        DATABASE_URL: undefined,
      }),
    ).toThrow('DATABASE_URL is required for packages/rpc.');
  });

  it('requires BETTER_AUTH_SECRET', () => {
    expect(() =>
      validateRpcEnv({
        ...validEnv,
        BETTER_AUTH_SECRET: undefined,
      }),
    ).toThrow('BETTER_AUTH_SECRET is required for packages/rpc.');
  });

  it('requires BETTER_AUTH_URL', () => {
    expect(() =>
      validateRpcEnv({
        ...validEnv,
        BETTER_AUTH_URL: undefined,
      }),
    ).toThrow('BETTER_AUTH_URL is required for packages/rpc.');
  });

  it('requires OCI object storage settings', () => {
    expect(() =>
      validateRpcEnv({
        ...validEnv,
        OCI_OBJECT_STORAGE_BUCKET: undefined,
      }),
    ).toThrow('OCI_OBJECT_STORAGE_BUCKET is required for packages/rpc.');
  });

  it('applies runtime defaults', () => {
    expect(validateRpcEnv(validEnv)).toEqual({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      BETTER_AUTH_SECRET: 'better-auth-secret-with-32-characters',
      BETTER_AUTH_URL: 'http://localhost:3002',
      WEB_ORIGIN: 'http://localhost:3001',
      PORT: '3002',
      NEVOBO_BASE_URL: 'https://api.nevobo.nl',
      NEVOBO_ASSOCIATION_ID: 'ckl9y0t',
      PROTOTOTO_SYNC_INTERVAL_MS: '900000',
      OCI_REGION: 'eu-amsterdam-1',
      OCI_TENANCY_OCID: 'ocid1.tenancy.oc1..example',
      OCI_USER_OCID: 'ocid1.user.oc1..example',
      OCI_FINGERPRINT: '00:11:22:33',
      OCI_PRIVATE_KEY:
        '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----',
      OCI_OBJECT_STORAGE_NAMESPACE: 'namespace',
      OCI_OBJECT_STORAGE_BUCKET: 'bucket',
      MAIL_HOST: '127.0.0.1',
      MAIL_PORT: 1025,
      MAIL_SECURE: false,
      MAIL_REQUIRE_TLS: false,
      MAIL_REJECT_UNAUTHORIZED: true,
      MAIL_FROM: 'Smoelenboek <noreply@smoelenboek.local>',
      MAIL_VERIFY_ON_STARTUP: false,
      MAIL_CONNECTION_TIMEOUT_MS: 10000,
      MAIL_GREETING_TIMEOUT_MS: 10000,
      MAIL_SOCKET_TIMEOUT_MS: 60000,
    });
  });
});

const productionMailEnv = {
  ...validEnv,
  NODE_ENV: 'production',
  MAIL_HOST: 'smtp.example.com',
  MAIL_PORT: '587',
  MAIL_SECURE: 'false',
  MAIL_REQUIRE_TLS: 'true',
  MAIL_REJECT_UNAUTHORIZED: 'true',
  MAIL_FROM: 'Smoelenboek <members@example.com>',
  MAIL_USER: 'smtp-user',
  MAIL_PASSWORD: 'smtp-password',
};
