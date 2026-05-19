'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Swagger UI est client-only (pas de SSR)
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Restreindre aux admins uniquement
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (status !== 'authenticated' || (session?.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-secondary text-white px-6 py-4 flex items-center gap-4">
        <h1 className="text-xl font-semibold">Documentation API</h1>
        <span className="text-sm opacity-60">Inventory Web App — v1.0.0</span>
      </div>
      <SwaggerUI
        url="/api/docs"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        tryItOutEnabled={true}
      />
    </div>
  );
}
