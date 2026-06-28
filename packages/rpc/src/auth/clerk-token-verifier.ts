import { createClerkClient, type AuthObject } from '@clerk/backend';
import { Injectable } from '@nestjs/common';
import type { IncomingHttpHeaders, IncomingMessage } from 'http';

import type { ClerkClaims } from './auth-context';

export const CLERK_AUTHENTICATOR = Symbol('CLERK_AUTHENTICATOR');

export type ClerkAuthResult = {
  userId: string | null;
  sessionId: string | null;
  orgId: string | null;
  claims: ClerkClaims | null;
};

export interface ClerkAuthenticator {
  authenticateRequest(request: IncomingMessage): Promise<ClerkAuthResult>;
}

@Injectable()
export class ClerkBackendAuthenticator implements ClerkAuthenticator {
  async authenticateRequest(request: IncomingMessage): Promise<ClerkAuthResult> {
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is required for Clerk authentication.');
    }

    const clerkClient = createClerkClient({ secretKey });
    const requestState = await clerkClient.authenticateRequest(
      this.toWebRequest(request),
      {
        acceptsToken: ['session_token', 'api_key'],
      },
    );

    if (!requestState.isAuthenticated) {
      return {
        userId: null,
        sessionId: null,
        orgId: null,
        claims: null,
      };
    }

    return this.toAuthResult(requestState.toAuth());
  }

  private toAuthResult(auth: AuthObject): ClerkAuthResult {
    if (!auth.isAuthenticated) {
      return {
        userId: null,
        sessionId: null,
        orgId: null,
        claims: null,
      };
    }

    if (auth.tokenType === 'session_token') {
      return {
        userId: auth.userId,
        sessionId: auth.sessionId,
        orgId: auth.orgId,
        claims: auth.sessionClaims as ClerkClaims,
      };
    }

    if (auth.tokenType === 'api_key') {
      return {
        userId: auth.userId ?? auth.subject,
        sessionId: null,
        orgId: auth.orgId,
        claims: {
          sub: auth.subject,
          api_key_id: auth.id,
          api_key_name: auth.name,
          api_key_scopes: auth.scopes,
          token_type: auth.tokenType,
          ...(auth.claims ?? {}),
        },
      };
    }

    return {
      userId: auth.subject,
      sessionId: null,
      orgId: null,
      claims: {
        sub: auth.subject,
        token_type: auth.tokenType,
      },
    };
  }

  private toWebRequest(request: IncomingMessage): Request {
    return new Request(this.readRequestUrl(request), {
      headers: this.toHeaders(request.headers),
      method: request.method ?? 'GET',
    });
  }

  private readRequestUrl(request: IncomingMessage): string {
    const host = request.headers.host ?? 'localhost:3002';
    const proto = this.readFirstHeader(request.headers['x-forwarded-proto']) ?? 'http';
    const path = request.url ?? '/';

    return new URL(path, `${proto}://${host}`).toString();
  }

  private toHeaders(headers: IncomingHttpHeaders): Headers {
    const result = new Headers();

    for (const [key, value] of Object.entries(headers)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          result.append(key, item);
        }
        continue;
      }

      if (typeof value === 'string') {
        result.set(key, value);
      }
    }

    return result;
  }

  private readFirstHeader(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }
}
