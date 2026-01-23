'use client';

import { ReactNode } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}

// Compatibility hook for existing code
export function useAuth() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const logout = async () => {
    await signOut({ redirect: false });
  };

  return {
    session,
    loading,
    logout,
  };
}
