import { describe, expect, it, jest } from '@jest/globals';
import { IncomingMessage } from 'http';

import { AuthContextFactory } from './auth-context.factory';
import type { ClerkAuthenticator } from './clerk-token-verifier';

function createRequest(authorization?: string): IncomingMessage {
  return {
    headers: {
      authorization,
    },
  } as IncomingMessage;
}

describe('AuthContextFactory', () => {
  it('creates the context through the Clerk authenticator', async () => {
    const authenticator: ClerkAuthenticator = {
      authenticateRequest: jest.fn().mockResolvedValue({
        userId: 'user_123',
        sessionId: 'sess_123',
        orgId: 'org_123',
        claims: {
          sub: 'user_123',
          sid: 'sess_123',
          org_id: 'org_123',
        },
      }),
    };
    const factory = new AuthContextFactory(authenticator);
    const request = createRequest('Bearer token_123');

    await expect(factory.create(request)).resolves.toEqual({
      userId: 'user_123',
      sessionId: 'sess_123',
      orgId: 'org_123',
      claims: {
        sub: 'user_123',
        sid: 'sess_123',
        org_id: 'org_123',
      },
    });
    expect(authenticator.authenticateRequest).toHaveBeenCalledWith(request);
  });
});
