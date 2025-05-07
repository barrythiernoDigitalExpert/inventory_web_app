import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/context/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Inventory Management System',
  description: 'Property inventory management solution',
};

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#121212] text-gray-200`}>
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}