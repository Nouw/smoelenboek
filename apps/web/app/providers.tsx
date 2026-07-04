'use client';

import type { ReactNode } from 'react';

import { TrpcProvider } from './trpc';

export function Providers({ children }: { children: ReactNode }) {
  return <TrpcProvider>{children}</TrpcProvider>;
}
