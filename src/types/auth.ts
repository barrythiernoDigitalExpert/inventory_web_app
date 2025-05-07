// types/auth.ts
export interface User {
    id: number;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
  }
  
  export interface LoginResponse {
    user: User;
    token: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
  }
  
  export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  }