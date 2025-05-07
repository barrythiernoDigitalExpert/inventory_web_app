'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;
    
    setIsSubmitting(true);
    const success = await login(email, password);
    
    if (success) {
      router.push(callbackUrl);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-[#2D2D2D] rounded-xl shadow-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
        <p className="mt-2 text-[#D4A017]">Sign in to your account</p>
      </div>
      
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-[#1E1E1E] border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:border-[#D4A017]"
            placeholder="name@company.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-[#1E1E1E] border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017] focus:border-[#D4A017]"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-[#D4A017] focus:ring-[#D4A017] border-gray-600 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link href="/reset-password" className="text-[#D4A017] hover:text-[#E6B52C]">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#D4A017] hover:bg-[#E6B52C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4A017] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Composant de chargement à afficher pendant la suspension
function LoginLoading() {
  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-[#2D2D2D] rounded-xl shadow-2xl flex justify-center items-center">
      <svg className="animate-spin h-10 w-10 text-[#D4A017]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1E1E1E] to-[#121212]">
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}