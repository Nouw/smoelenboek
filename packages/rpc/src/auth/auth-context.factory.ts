import { Inject, Injectable } from '@nestjs/common';
import type { IncomingMessage } from 'http';

import type { AuthContext } from './auth-context';
import {
  BETTER_AUTH_AUTHENTICATOR,
  type BetterAuthAuthenticator,
} from './better-auth-authenticator';

@Injectable()
export class AuthContextFactory {
  constructor(
    @Inject(BETTER_AUTH_AUTHENTICATOR)
    private readonly authenticator: BetterAuthAuthenticator,
  ) {}

  async create(request: IncomingMessage): Promise<AuthContext> {
    return this.authenticator.authenticateRequest(request);
  }
}
