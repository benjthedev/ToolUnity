'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function VerifyEmailSentPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setEmail(params.get('email') || '');
    } catch (e) {
      // Silently handle errors
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      setResendMessage('Email address is missing');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (response.ok) {
        setResendMessage('✓ Verification email sent successfully. Please check your inbox.');
      } else {
        setResendMessage('Failed to resend email. Please try again later.');
      }
    } catch (error) {
      setResendMessage('Error sending email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Verify your email</h2>
          
          <p className="mt-4 text-gray-600">
            We've sent a verification link to:
          </p>
          
          <p className="mt-2 font-semibold text-gray-900 break-all">
            {email}
          </p>
          
          <p className="mt-4 text-sm text-gray-600">
            Click the link in the email to verify your account. The link will expire in 24 hours.
          </p>

          {resendMessage && (
            <div className={`mt-4 p-3 rounded ${
              resendMessage.startsWith('✓') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {resendMessage}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              Go to login
            </button>
            
            <button
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            Can't find the email? Check your spam folder or try resending it.
          </p>
        </div>
      </div>
    </div>
  );
}
