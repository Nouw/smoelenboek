import { Module } from '@nestjs/common';

import { AuthContextFactory } from './auth-context.factory';
import {
  CLERK_TOKEN_VERIFIER,
  ClerkBackendTokenVerifier,
} from './clerk-token-verifier';

@Module({
  providers: [
    AuthContextFactory,
    {
      provide: CLERK_TOKEN_VERIFIER,
      useClass: ClerkBackendTokenVerifier,
    },
  ],
  exports: [AuthContextFactory, CLERK_TOKEN_VERIFIER],
})
export class AuthModule {}
