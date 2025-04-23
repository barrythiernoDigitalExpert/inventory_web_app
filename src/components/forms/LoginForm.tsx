'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // This would be replaced with your actual authentication logic
      // For now, we'll simulate a successful login
      setTimeout(() => {
        // Store token, user info etc. in localStorage or cookies
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect to dashboard
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-6">
        <label htmlFor="email" className="block mb-2 text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your.email@example.com"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="password" className="block mb-2 text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="mb-4 text-red-500 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            className="w-4 h-4 border rounded bg-secondary-light border-secondary-light focus:ring-primary"
          />
          <label htmlFor="remember" className="ml-2 text-sm">
            Remember me
          </label>
        </div>
        
        <a href="#" className="text-sm text-primary hover:text-primary-light">
          Forgot password?
        </a>
      </div>
      
      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Sign In'}
      </button>
    </form>
  );
};