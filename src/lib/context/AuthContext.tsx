// 'use client';

// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { authService } from '@/lib/services/authService';
// import { LoginCredentials, User, AuthState } from '@/types/auth';
// import { useRouter } from 'next/navigation';

// interface AuthContextType extends AuthState {
//   login: (credentials: LoginCredentials) => Promise<void>;
//   logout: () => void;
// }

// const initialState: AuthState = {
//   user: null,
//   isLoading: true,
//   isAuthenticated: false,
// };

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [state, setState] = useState<AuthState>(initialState);
//   const router = useRouter();

//   useEffect(() => {
//     const initAuth = async () => {
//       try {
//         if (authService.isAuthenticated()) {
//           // Fetch current user info
//           const response = await fetch('/api/auth/me', {
//             headers: {
//               Authorization: `Bearer ${authService.getToken()}`,
//             },
//           });
          
//           if (response.ok) {
//             const user = await response.json();
//             setState({
//               user,
//               isAuthenticated: true,
//               isLoading: false,
//             });
//           } else {
//             // Token is invalid, clear it
//             authService.logout();
//             setState({
//               ...initialState,
//               isLoading: false,
//             });
//           }
//         } else {
//           setState({
//             ...initialState,
//             isLoading: false,
//           });
//         }
//       } catch (error) {
//         console.error('Auth initialization error:', error);
//         setState({
//           ...initialState,
//           isLoading: false,
//         });
//       }
//     };

//     initAuth();
//   }, []);

//   const login = async (credentials: LoginCredentials): Promise<void> => {
//     setState((prev) => ({ ...prev, isLoading: true }));
    
//     try {
//       const response = await authService.login(credentials);
//       setState({
//         user: response.user,
//         isAuthenticated: true,
//         isLoading: false,
//       });
//       console.log(response);
//       router.replace('/dashboard');
//     } catch (error) {
//       setState((prev) => ({ ...prev, isLoading: false }));
//       throw error;
//     }
//   };

//   const logout = () => {
//     authService.logout();
//     setState({
//       user: null,
//       isAuthenticated: false,
//       isLoading: false,
//     });
//     router.push('/auth/login');
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         ...state,
//         login,
//         logout,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'consultant' | 'client';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
  checkPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;

  useEffect(() => {
    if (session?.user) {
      // Transform session user to our User type
      setUser({
        id: session.user.id as string,
        email: session.user.email as string,
        name: session.user.name as string,
        role: (session.user.role as UserRole) || 'client',
        image: session.user.image || undefined
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      });
      
      if (result?.error) {
        setError(result.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('An unexpected error occurred');
      return false;
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const checkPermission = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      error,
      checkPermission
    }}>
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