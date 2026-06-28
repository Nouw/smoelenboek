import { Inject, Injectable } from '@nestjs/common';
import type { IncomingMessage } from 'http';

import type { AuthContext } from './auth-context';
import {
  CLERK_AUTHENTICATOR,
  type ClerkAuthenticator,
} from './clerk-token-verifier';

@Injectable()
export class AuthContextFactory {
  constructor(
    @Inject(CLERK_AUTHENTICATOR)
    private readonly authenticator: ClerkAuthenticator,
  ) {}

  async create(request: IncomingMessage): Promise<AuthContext> {
    return this.authenticator.authenticateRequest(request);
  }
}
