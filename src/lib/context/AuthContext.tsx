'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Must match Prisma UserRole enum exactly
export type UserRole = 'ADMIN' | 'USER';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
  checkPermission: (allowedRoles: UserRole[]) => boolean;
  checkActive: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (session?.user) {
      const rawRole = session.user.role as string | undefined;
      // Normalise: accept 'ADMIN' or legacy 'admin' from older tokens
      const role: UserRole =
        rawRole?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';

      setUser({
        id: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name as string,
        role,
        isActive: session.user.isActive as boolean,
        image: session.user.image || undefined,
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const checkActive = () => (user ? user.isActive : false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
        return false;
      }

      return true;
    } catch {
      setError('An unexpected error occurred');
      return false;
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const checkPermission = (allowedRoles: UserRole[]) =>
    user ? allowedRoles.includes(user.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        logout,
        error,
        checkPermission,
        checkActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
