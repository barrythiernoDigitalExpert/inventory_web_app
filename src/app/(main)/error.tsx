'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MainError]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212]">
      <div className="bg-[#1E1E1E] border border-red-800/40 rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {error.message || 'Quelque chose ne s\'est pas passé comme prévu.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4A017] text-black font-medium rounded-lg hover:bg-[#b8891a] transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}
