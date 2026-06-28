import { Module } from '@nestjs/common';

import { AuthContextFactory } from './auth-context.factory';
import {
  CLERK_AUTHENTICATOR,
  ClerkBackendAuthenticator,
} from './clerk-token-verifier';

@Module({
  providers: [
    AuthContextFactory,
    {
      provide: CLERK_AUTHENTICATOR,
      useClass: ClerkBackendAuthenticator,
    },
  ],
  exports: [AuthContextFactory, CLERK_AUTHENTICATOR],
})
export class AuthModule {}
