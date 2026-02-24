'use client';

import { LoadingProvider } from '@/contexts/LoadingContext';

export default function LoadingProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadingProvider>
      {children}
    </LoadingProvider>
  );
}

