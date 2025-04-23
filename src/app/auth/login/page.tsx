import { Logo } from '@/components/ui/Logo';
import { LoginForm } from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Logo width={220} height={140} className="mb-6" />
          <h2 className="text-2xl font-bold text-neutral mt-2">
            Inventory Management System
          </h2>
          <p className="mt-2 text-sm text-neutral-gray">
            Sign in to your account
          </p>
        </div>
        
        <div className="mt-8 card">
          <LoginForm />
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-neutral-gray">
        <p>© {new Date().getFullYear()} Exclusive Algarve Villas. All rights reserved.</p>
      </div>
    </div>
  );
}