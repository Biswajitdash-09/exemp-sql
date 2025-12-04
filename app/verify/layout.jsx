"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyLayout({ children }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('verifier_session');
    
    if (!sessionData) {
      router.replace('/login');
      return;
    }

    try {
      // Check if session data is valid JSON, which confirms a session exists.
      // The project doesn't store a 'type' field in the session object itself.
      // The existence of 'verifier_session' is the check for a verifier.
      JSON.parse(sessionData);
      setIsVerified(true);
    } catch (error) {
      console.error("Invalid verifier session data:", error);
      localStorage.removeItem('verifier_session');
      router.replace('/login');
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
              Verifying your session...
            </p>
            <p className="text-base-content/70">Please wait a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return <>{children}</>;
  }

  // Return null while redirecting to prevent flashing of un-authed content
  return null;
}