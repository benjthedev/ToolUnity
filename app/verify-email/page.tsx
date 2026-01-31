'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const error = params.get('error');

      if (success === 'true') {
        setStatus('success');
        // Force session refresh before redirect
        setTimeout(() => {
          // Refresh the page to get new session with emailVerified=true
          window.location.href = '/dashboard';
        }, 2000);
      } else if (success === 'already') {
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
      } else if (error === 'expired') {
        setStatus('expired');
      } else if (error) {
        setStatus('error');
      }
    } catch (e) {
      // Silently handle errors
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying your email...</h2>
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mt-6 inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Email verified!</h2>
              <p className="mt-4 text-gray-600">
                Your email has been successfully verified. You can now use all ToolUnity features.
              </p>
              <p className="mt-2 text-sm text-gray-500">Redirecting to login in a moment...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mt-6 inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Verification failed</h2>
              <p className="mt-4 text-gray-600">
                The verification link is invalid or has already been used.
              </p>
              <button
                onClick={() => router.push('/signup')}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              >
                Create a new account
              </button>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="mt-6 inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Verification link expired</h2>
              <p className="mt-4 text-gray-600">
                Your verification link has expired. Please sign up again or request a new verification link.
              </p>
              <button
                onClick={() => router.push('/signup')}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
