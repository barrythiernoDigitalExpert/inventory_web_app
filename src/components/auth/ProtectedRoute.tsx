'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { signOut } from 'next-auth/react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading , user } = useAuth();
  const router = useRouter();

 useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user && !user.isActive) {
        // Redirect inactive users and sign them out
        signOut({ redirect: false });
        router.replace('/login?error=inactive');
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4A017]"></div>
      </div>
    );
  }

   if (!isAuthenticated || (user && !user.isActive)) {
    return null;
  }

  return <>{children}</>;
}