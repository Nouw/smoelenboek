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
  OCI_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----',
  OCI_OBJECT_STORAGE_NAMESPACE: 'namespace',
  OCI_OBJECT_STORAGE_BUCKET: 'bucket',
};

describe('validateRpcEnv', () => {
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
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      BETTER_AUTH_SECRET: 'better-auth-secret-with-32-characters',
      BETTER_AUTH_URL: 'http://localhost:3002',
      WEB_ORIGIN: 'http://localhost:3001',
      PORT: '3002',
      OCI_REGION: 'eu-amsterdam-1',
      OCI_TENANCY_OCID: 'ocid1.tenancy.oc1..example',
      OCI_USER_OCID: 'ocid1.user.oc1..example',
      OCI_FINGERPRINT: '00:11:22:33',
      OCI_PRIVATE_KEY:
        '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----',
      OCI_OBJECT_STORAGE_NAMESPACE: 'namespace',
      OCI_OBJECT_STORAGE_BUCKET: 'bucket',
    });
  });
});
