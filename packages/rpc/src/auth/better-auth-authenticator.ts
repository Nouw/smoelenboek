import { Injectable } from '@nestjs/common';
import type { IncomingHttpHeaders, IncomingMessage } from 'http';

import type { AuthContext } from './auth-context';
import { getBetterAuth } from './better-auth-instance';

export const BETTER_AUTH_AUTHENTICATOR = Symbol('BETTER_AUTH_AUTHENTICATOR');

export interface BetterAuthAuthenticator {
  authenticateRequest(request: IncomingMessage): Promise<AuthContext>;
}

type BetterAuthSession = {
  session: {
    id: string;
    userId: string;
  };
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      name: string;
      role?: string | null;
      image?: string | null;
      firstName?: string | null;
      lastName?: string | null;
  };
};

type BetterAuthApiKeyVerification = {
  valid: boolean;
  key: {
    id: string;
    name: string | null;
    referenceId: string;
    permissions?: unknown;
    metadata?: unknown;
  } | null;
};

@Injectable()
export class BetterAuthBackendAuthenticator implements BetterAuthAuthenticator {
  async authenticateRequest(request: IncomingMessage): Promise<AuthContext> {
    const sessionContext = await this.authenticateSession(request);

    if (sessionContext.userId) {
      return sessionContext;
    }

    return this.authenticateApiKey(request);
  }

  private async authenticateSession(
    request: IncomingMessage,
  ): Promise<AuthContext> {
    const auth = await getBetterAuth();
    const session = (await auth.api.getSession({
      headers: this.toHeaders(request.headers),
    })) as BetterAuthSession | null;

    if (!session) {
      return anonymousContext();
    }

    return {
      userId: session.user.id,
      sessionId: session.session.id,
      orgId: null,
      authType: 'session',
      role: session.user.role ?? 'user',
      claims: {
        sub: session.user.id,
        email: session.user.email,
        email_verified: session.user.emailVerified,
        name: session.user.name,
        role: session.user.role ?? 'user',
        first_name: session.user.firstName ?? undefined,
        last_name: session.user.lastName ?? undefined,
        image_url: session.user.image ?? undefined,
      },
    };
  }

  private async authenticateApiKey(
    request: IncomingMessage,
  ): Promise<AuthContext> {
    const apiKey = this.readBearerToken(request.headers.authorization);

    if (!apiKey) {
      return anonymousContext();
    }

    const auth = await getBetterAuth();
    const result = (await auth.api.verifyApiKey({
      body: { key: apiKey },
    })) as BetterAuthApiKeyVerification;

    if (!result.valid || !result.key) {
      return anonymousContext();
    }

    return {
      userId: result.key.referenceId,
      sessionId: null,
      orgId: null,
      authType: 'api_key',
      role: null,
      claims: {
        sub: result.key.referenceId,
        api_key_id: result.key.id,
        api_key_name: result.key.name,
        api_key_permissions: result.key.permissions,
        api_key_metadata: result.key.metadata,
        token_type: 'api_key',
      },
    };
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

  private readBearerToken(authorization: string | undefined): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }
}

function anonymousContext(): AuthContext {
  return {
    userId: null,
    sessionId: null,
    orgId: null,
    authType: null,
    role: null,
    claims: null,
  };
}
