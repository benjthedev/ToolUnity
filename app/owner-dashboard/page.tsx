'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main dashboard - everything is consolidated there now
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
