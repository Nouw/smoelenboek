'use client';

import { apiKeyClient } from '@better-auth/api-key/client';
import { createAuthClient, type ReactAuthClient } from 'better-auth/react';

export const authClient: ReactAuthClient<{
  baseURL: string;
}> = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3002',
  plugins: [apiKeyClient()],
});
