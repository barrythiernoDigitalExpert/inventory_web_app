// services/authService.ts
import { LoginCredentials, LoginResponse } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store auth data if remember is checked
    if (credentials.remember) {
      localStorage.setItem('auth_token', data.token);
    } else {
      sessionStorage.setItem('auth_token', data.token);
    }
    
    return data;
  },

  logout() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    // Additional cleanup if needed
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};