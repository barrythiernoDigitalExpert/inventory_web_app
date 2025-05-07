'use client';

import Link from 'next/link';

export function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="text-[#D4A017] mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-6l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
      <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
      <Link href="/dashboard" className="px-4 py-2 bg-[#D4A017] text-black rounded hover:bg-[#E6B52C] transition-colors">
        Back to Dashboard
      </Link>
    </div>
  );
}