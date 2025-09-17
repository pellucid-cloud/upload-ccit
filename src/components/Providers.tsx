'use client';

import { LoadingProvider } from '@/contexts/LoadingContext';
import { SessionProvider } from 'next-auth/react';
import GlobalLoading from './GlobalLoading';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <SessionProvider>{children}</SessionProvider>
      <GlobalLoading />
    </LoadingProvider>
  );
}
