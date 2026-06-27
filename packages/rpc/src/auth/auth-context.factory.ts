import { Inject, Injectable } from '@nestjs/common';
import type { IncomingMessage } from 'http';

import type { AuthContext } from './auth-context';
import {
  CLERK_TOKEN_VERIFIER,
  type ClerkTokenVerifier,
} from './clerk-token-verifier';

@Injectable()
export class AuthContextFactory {
  constructor(
    @Inject(CLERK_TOKEN_VERIFIER)
    private readonly tokenVerifier: ClerkTokenVerifier,
  ) {}

  async create(request: IncomingMessage): Promise<AuthContext> {
    const token = this.readBearerToken(request);

    if (!token) {
      return {
        userId: null,
        sessionId: null,
        orgId: null,
        claims: null,
      };
    }

    const claims = await this.tokenVerifier.verifyToken(token);

    return {
      userId: claims.sub ?? null,
      sessionId: claims.sid ?? null,
      orgId: claims.org_id ?? null,
      claims,
    };
  }

  private readBearerToken(request: IncomingMessage): string | null {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    return authorization.slice('Bearer '.length).trim() || null;
  }
}
