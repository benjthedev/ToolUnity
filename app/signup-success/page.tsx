'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  useEffect(() => {
    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <span className="text-4xl">✉️</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Created!</h1>
        
        <p className="text-gray-600 mb-2">
          We've sent a verification email to:
        </p>
        <p className="font-semibold text-gray-900 mb-6 break-all">
          {email}
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Check your inbox</strong> and click the verification link to activate your account and start renting and lending tools!
          </p>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          Redirecting to dashboard in 5 seconds...
        </p>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}
