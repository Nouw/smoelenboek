import { describe, expect, it, jest } from '@jest/globals';
import { IncomingMessage } from 'http';

const authenticateRequest = jest.fn();

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({ authenticateRequest })),
}));

import { ClerkBackendAuthenticator } from './clerk-token-verifier';

function createRequest(authorization?: string): IncomingMessage {
  return {
    headers: {
      authorization,
      host: 'localhost:3002',
    },
    method: 'POST',
    url: '/trpc/user.me',
  } as IncomingMessage;
}

describe('ClerkBackendAuthenticator', () => {
  it('returns anonymous context when Clerk does not authenticate the request', async () => {
    authenticateRequest.mockResolvedValue({
      isAuthenticated: false,
      toAuth: jest.fn(),
    });
    const previousSecretKey = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    const authenticator = new ClerkBackendAuthenticator();

    await expect(authenticator.authenticateRequest(createRequest())).resolves.toEqual({
      userId: null,
      sessionId: null,
      orgId: null,
      claims: null,
    });

    process.env.CLERK_SECRET_KEY = previousSecretKey;
  });

  it('accepts Clerk session tokens', async () => {
    authenticateRequest.mockResolvedValue({
      isAuthenticated: true,
      toAuth: () => ({
        isAuthenticated: true,
        tokenType: 'session_token',
        userId: 'user_123',
        sessionId: 'sess_123',
        orgId: 'org_123',
        sessionClaims: {
          sub: 'user_123',
          sid: 'sess_123',
          org_id: 'org_123',
        },
      }),
    });
    const previousSecretKey = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    const authenticator = new ClerkBackendAuthenticator();

    await expect(
      authenticator.authenticateRequest(createRequest('Bearer session_token')),
    ).resolves.toEqual({
      userId: 'user_123',
      sessionId: 'sess_123',
      orgId: 'org_123',
      claims: {
        sub: 'user_123',
        sid: 'sess_123',
        org_id: 'org_123',
      },
    });
    expect(authenticateRequest).toHaveBeenCalledWith(expect.any(Request), {
      acceptsToken: ['session_token', 'api_key'],
    });

    process.env.CLERK_SECRET_KEY = previousSecretKey;
  });

  it('accepts Clerk API keys', async () => {
    authenticateRequest.mockResolvedValue({
      isAuthenticated: true,
      toAuth: () => ({
        isAuthenticated: true,
        tokenType: 'api_key',
        id: 'ak_123',
        name: 'Docs',
        subject: 'user_123',
        userId: 'user_123',
        orgId: null,
        scopes: ['read', 'write'],
        claims: { purpose: 'docs' },
      }),
    });
    const previousSecretKey = process.env.CLERK_SECRET_KEY;
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    const authenticator = new ClerkBackendAuthenticator();

    await expect(
      authenticator.authenticateRequest(createRequest('Bearer ak_secret')),
    ).resolves.toEqual({
      userId: 'user_123',
      sessionId: null,
      orgId: null,
      claims: {
        sub: 'user_123',
        api_key_id: 'ak_123',
        api_key_name: 'Docs',
        api_key_scopes: ['read', 'write'],
        token_type: 'api_key',
        purpose: 'docs',
      },
    });

    process.env.CLERK_SECRET_KEY = previousSecretKey;
  });
});
