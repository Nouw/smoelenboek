import { Module } from '@nestjs/common';

import { AuthContextFactory } from './auth-context.factory';
import {
  BETTER_AUTH_AUTHENTICATOR,
  BetterAuthBackendAuthenticator,
} from './better-auth-authenticator';

@Module({
  providers: [
    AuthContextFactory,
    {
      provide: BETTER_AUTH_AUTHENTICATOR,
      useClass: BetterAuthBackendAuthenticator,
    },
  ],
  exports: [AuthContextFactory, BETTER_AUTH_AUTHENTICATOR],
})
export class AuthModule {}
