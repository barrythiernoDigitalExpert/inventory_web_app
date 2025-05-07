'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { AccessDenied } from './AccessDenied';

type UserRole = 'admin' | 'consultant' | 'client';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles,
  fallback = <AccessDenied />
}: RoleBasedRouteProps) {
  const { user, isLoading, checkPermission } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4A017]"></div>
      </div>
    );
  }
  
  if (!user || !checkPermission(allowedRoles)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}