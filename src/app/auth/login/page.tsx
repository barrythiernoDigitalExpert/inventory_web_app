import { Logo } from '@/components/ui/Logo';
import { LoginForm } from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Logo width={220} height={140} className="mb-6" />
          <h2 className="text-2xl font-bold text-white mt-2">
            Inventory Management System
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to your account
          </p>
        </div>
        
        <div className="mt-8 bg-gray-800 shadow-xl rounded-lg p-6">
          <LoginForm />
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Exclusive Algarve Villas. All rights reserved.</p>
      </div>
    </div>
  );
}