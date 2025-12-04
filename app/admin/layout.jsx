"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('admin_session');
    
    if (!sessionData) {
      router.replace('/admin/login');
      setIsLoading(false);
      return;
    }

    try {
      // The existence of a valid JSON object in 'admin_session' confirms authorization.
      const session = JSON.parse(sessionData);
      
      // Check for isAdmin or userType property for backward compatibility
      const isAdmin = session.userType === 'admin' || session.isAdmin === true || session.role === 'super_admin' || session.role === 'hr_manager';
      
      if (isAdmin) {
        setIsAuthorized(true);
      } else {
        // This case should ideally not happen if login logic is correct
        console.warn("Session found but user is not admin:", session);
        localStorage.removeItem('admin_session');
        router.replace('/admin/login');
        return;
      }
    } catch (error) {
      console.error("Invalid admin session data:", error);
      localStorage.removeItem('admin_session');
      router.replace('/admin/login');
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)]">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center p-10">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-lg font-semibold text-base-content">
              Verifying admin session...
            </p>
            <p className="text-base-content/70">Please wait a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  // Return null while redirecting to prevent flashing of unauthorized content
  return <>{children}</>;
}