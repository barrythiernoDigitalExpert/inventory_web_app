'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-[#121212] text-gray-200 flex items-center justify-center min-h-screen">
        <div className="bg-[#1E1E1E] border border-red-800/40 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-14 w-14 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Erreur inattendue
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {error.message || 'Une erreur critique est survenue.'}
            {error.digest && (
              <span className="block mt-1 text-xs text-gray-600">
                Ref: {error.digest}
              </span>
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A017] text-black font-medium rounded-lg hover:bg-[#b8891a] transition-colors text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-gray-300 font-medium rounded-lg hover:bg-[#333] transition-colors text-sm"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
