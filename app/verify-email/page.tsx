'use client';

export const dynamic = 'force-dynamic';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { getSupabase } from '@/lib/supabase';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  
  const [status, setStatus] = useState<'checking' | 'waiting' | 'success' | 'error' | 'expired'>('waiting');
  const [isChecking, setIsChecking] = useState(false);

  // Check verification status
  const checkVerification = useCallback(async () => {
    if (!email) return;
    
    setIsChecking(true);
    try {
      const sb = getSupabase();
      // Use ilike for case-insensitive matching
      const { data, error: queryError } = await sb
        .from('users_ext')
        .select('email_verified')
        .ilike('email', email) // case-insensitive
        .single();

      console.log('Verification check:', { email, data, error: queryError });

      if (queryError) {
        console.error('Query error:', queryError);
        setStatus('waiting');
        setIsChecking(false);
        return;
      }

      if (data?.email_verified) {
        console.log('Email verified! Redirecting...');
        setStatus('success');
        // Redirect after showing success for 1 second
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        console.log('Email not yet verified');
        setStatus('waiting');
        setIsChecking(false);
      }
    } catch (err) {
      console.error('Check error:', err);
      setStatus('waiting');
      setIsChecking(false);
    }
  }, [email]);

  useEffect(() => {
    // Handle redirect from successful verification link
    if (success === 'true') {
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      return; // Stop here, don't set up interval
    } else if (error === 'expired') {
      setStatus('expired');
      return; // Stop here, don't set up interval
    } else if (error) {
      setStatus('error');
      return; // Stop here, don't set up interval
    }

    // If already success, don't set up interval
    if (status === 'success') {
      return;
    }

    if (!email) return;

    // Auto-check every 2 seconds while waiting
    const interval = setInterval(() => {
      checkVerification();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [success, error, email, checkVerification, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'waiting' && (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Verify your email</h2>
              <p className="mt-4 text-gray-600">
                We've sent a verification link to <strong>{email}</strong>
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Click the link in the email to verify your account. We're automatically checking every 3 seconds...
              </p>
              <button
                onClick={checkVerification}
                disabled={isChecking}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded"
              >
                {isChecking ? 'Checking...' : 'Check verification'}
              </button>
              <p className="mt-3 text-xs text-gray-400">
                Click above if you've already verified in your email
              </p>
            </>
          )}

          {status === 'checking' && (
            <>
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Checking verification...</h2>
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
              <p className="mt-2 text-sm text-gray-500">Redirecting to dashboard...</p>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
