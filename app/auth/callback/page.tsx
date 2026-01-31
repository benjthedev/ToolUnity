'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase sends the access token in the URL hash
    // The session should be automatically updated by next-auth
    // Wait 2 seconds to show the success message, then redirect to dashboard
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="text-center">
        <div className="text-6xl mb-4">✓</div>
        <p className="text-2xl font-bold text-gray-900">Email Verified!</p>
        <p className="text-gray-600 mt-2">Your email has been confirmed.</p>
        <p className="text-gray-500 text-sm mt-4">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
