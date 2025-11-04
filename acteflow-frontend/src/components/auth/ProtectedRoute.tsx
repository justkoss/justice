'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  
  useEffect(() => {
    // Redirect to login if not authenticated


    

    // Check role permissions if specified
    console.log('user role:', user?.role);
    console.log('requiredRoles:', requiredRoles);
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      // Redirect to dashboard if user doesn't have required role
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, requiredRoles, router]);

  // Show loading state while checking auth
  if (!isAuthenticated || (requiredRoles && user && !requiredRoles.includes(user.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold-primary border-t-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
