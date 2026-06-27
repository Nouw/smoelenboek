import { describe, expect, it, jest } from '@jest/globals';
import { IncomingMessage } from 'http';

import { AuthContextFactory } from './auth-context.factory';
import type { ClerkTokenVerifier } from './clerk-token-verifier';

function createRequest(authorization?: string): IncomingMessage {
  return {
    headers: {
      authorization,
    },
  } as IncomingMessage;
}

describe('AuthContextFactory', () => {
  it('creates an anonymous context without a bearer token', async () => {
    const verifier: ClerkTokenVerifier = {
      verifyToken: jest.fn(),
    };
    const factory = new AuthContextFactory(verifier);

    await expect(factory.create(createRequest())).resolves.toEqual({
      userId: null,
      sessionId: null,
      orgId: null,
      claims: null,
    });
  });

  it('verifies bearer tokens and maps Clerk claims', async () => {
    const verifier: ClerkTokenVerifier = {
      verifyToken: jest.fn().mockResolvedValue({
        sub: 'user_123',
        sid: 'sess_123',
        org_id: 'org_123',
      }),
    };
    const factory = new AuthContextFactory(verifier);

    await expect(factory.create(createRequest('Bearer token_123'))).resolves.toEqual(
      {
        userId: 'user_123',
        sessionId: 'sess_123',
        orgId: 'org_123',
        claims: {
          sub: 'user_123',
          sid: 'sess_123',
          org_id: 'org_123',
        },
      },
    );
  });
});
