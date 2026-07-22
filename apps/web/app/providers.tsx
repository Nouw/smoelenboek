'use client';

import type { ReactNode } from 'react';

import { I18nProvider } from '@/lib/i18n';
import { TrpcProvider } from './trpc';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <TrpcProvider>{children}</TrpcProvider>
    </I18nProvider>
  );
}
