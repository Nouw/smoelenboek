'use client';

import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

import { TrpcProvider } from './trpc';

export function Providers({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <TrpcProvider>{children}</TrpcProvider>
    </ClerkProvider>
  );
}
