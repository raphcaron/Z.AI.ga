'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { FavoritesProvider } from '@/hooks/use-favorites';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider>
        {children}
      </FavoritesProvider>
    </AuthProvider>
  );
}
