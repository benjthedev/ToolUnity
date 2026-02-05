'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForOwnersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/how-it-works');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
