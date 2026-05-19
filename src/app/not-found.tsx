import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212]">
      <div className="text-center max-w-md mx-4">
        <p className="text-8xl font-bold text-[#D4A017] mb-4">404</p>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Page introuvable
        </h1>
        <p className="text-gray-400 mb-8">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4A017] text-black font-medium rounded-lg hover:bg-[#b8891a] transition-colors"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E1E1E] text-gray-300 font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors border border-gray-700"
          >
            <Search className="h-4 w-4" />
            Propriétés
          </Link>
        </div>
      </div>
    </div>
  );
}
