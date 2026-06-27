import { verifyToken } from '@clerk/backend';
import { Injectable } from '@nestjs/common';

import type { ClerkClaims } from './auth-context';

export const CLERK_TOKEN_VERIFIER = Symbol('CLERK_TOKEN_VERIFIER');

export interface ClerkTokenVerifier {
  verifyToken(token: string): Promise<ClerkClaims>;
}

@Injectable()
export class ClerkBackendTokenVerifier implements ClerkTokenVerifier {
  async verifyToken(token: string): Promise<ClerkClaims> {
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is required for Clerk token verification.');
    }

    return verifyToken(token, { secretKey }) as Promise<ClerkClaims>;
  }
}
