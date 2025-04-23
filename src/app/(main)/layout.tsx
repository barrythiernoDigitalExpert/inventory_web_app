import { Navigation } from '@/components/layout/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-secondary-dark py-4">
        <div className="container mx-auto px-4 text-center text-neutral-gray text-sm">
          © {new Date().getFullYear()} Exclusive Algarve Villas. All rights reserved.
        </div>
      </footer>
    </div>
  );
}