import { describe, expect, it, jest } from '@jest/globals';
import { IncomingMessage } from 'http';

const getSession = jest.fn();
const verifyApiKey = jest.fn();

jest.mock('./better-auth-instance', () => ({
  getBetterAuth: jest.fn(() =>
    Promise.resolve({
      api: {
        getSession,
        verifyApiKey,
      },
    }),
  ),
}));

import { BetterAuthBackendAuthenticator } from './better-auth-authenticator';

function createRequest(headers: IncomingMessage['headers']): IncomingMessage {
  return {
    headers: {
      host: 'localhost:3002',
      ...headers,
    },
    method: 'POST',
    url: '/trpc/user.me',
  } as IncomingMessage;
}

describe('BetterAuthBackendAuthenticator', () => {
  it('returns anonymous context when Better Auth does not authenticate the request', async () => {
    getSession.mockResolvedValue(null);
    const authenticator = new BetterAuthBackendAuthenticator();

    await expect(authenticator.authenticateRequest(createRequest({}))).resolves.toEqual({
      userId: null,
      sessionId: null,
      orgId: null,
      authType: null,
      claims: null,
    });
  });

  it('accepts Better Auth session cookies', async () => {
    getSession.mockResolvedValue({
      session: {
        id: 'session_123',
        userId: 'user_123',
      },
      user: {
        id: 'user_123',
        email: 'member@example.com',
        emailVerified: true,
        name: 'Member Example',
        image: 'https://example.com/avatar.png',
        firstName: 'Member',
        lastName: 'Example',
      },
    });
    const authenticator = new BetterAuthBackendAuthenticator();

    await expect(
      authenticator.authenticateRequest(
        createRequest({ cookie: 'better-auth.session_token=token' }),
      ),
    ).resolves.toEqual({
      userId: 'user_123',
      sessionId: 'session_123',
      orgId: null,
      authType: 'session',
      claims: {
        sub: 'user_123',
        email: 'member@example.com',
        email_verified: true,
        name: 'Member Example',
        first_name: 'Member',
        last_name: 'Example',
        image_url: 'https://example.com/avatar.png',
      },
    });
    expect(getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it('accepts Better Auth API keys', async () => {
    getSession.mockResolvedValue(null);
    verifyApiKey.mockResolvedValue({
      valid: true,
      key: {
        id: 'key_123',
        name: 'Docs',
        referenceId: 'user_123',
        permissions: { docs: ['read'] },
        metadata: { purpose: 'docs' },
      },
    });
    const authenticator = new BetterAuthBackendAuthenticator();

    await expect(
      authenticator.authenticateRequest(
        createRequest({ authorization: 'Bearer docs_api_key' }),
      ),
    ).resolves.toEqual({
      userId: 'user_123',
      sessionId: null,
      orgId: null,
      authType: 'api_key',
      claims: {
        sub: 'user_123',
        api_key_id: 'key_123',
        api_key_name: 'Docs',
        api_key_permissions: { docs: ['read'] },
        api_key_metadata: { purpose: 'docs' },
        token_type: 'api_key',
      },
    });
    expect(verifyApiKey).toHaveBeenCalledWith({
      body: { key: 'docs_api_key' },
    });
  });
});
