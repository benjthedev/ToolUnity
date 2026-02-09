'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

function ReportIssueContent() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get('rental_id');
  const toolName = searchParams.get('tool_name') || 'Tool';

  const [status, setStatus] = useState<'ready' | 'submitting' | 'done' | 'error'>('ready');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReport = async () => {
    if (!rentalId || !session?.user?.id) return;

    setStatus('submitting');

    try {
      // Call the claim API to freeze the deposit
      const res = await fetch('/api/deposits/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rental_id: rentalId,
          reason: `Owner reported damage/missing for "${toolName}" — awaiting email follow-up`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to report an issue.</p>
          <Link href="/login" className="text-blue-600 hover:underline font-semibold">Sign In</Link>
        </div>
      </div>
    );
  }

  if (!rentalId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid report link. Please go back to your dashboard.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline font-semibold">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-xl mx-auto px-4">

        {status === 'ready' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900">Report Damage or Missing Tool</h1>
              <p className="text-gray-600 mt-2">Tool: <strong>{decodeURIComponent(toolName)}</strong></p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>What happens when you report:</strong>
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• The renter&apos;s £10 deposit will be <strong>frozen</strong> (not auto-refunded)</li>
                <li>• You&apos;ll be asked to email us with details so we can investigate</li>
                <li>• An admin will review and decide the outcome</li>
              </ul>
            </div>

            <button
              onClick={handleReport}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition text-lg"
            >
              Report Damage / Missing Tool
            </button>

            <Link
              href="/dashboard"
              className="block text-center text-gray-500 mt-4 hover:text-gray-700 text-sm"
            >
              ← Cancel and go back
            </Link>
          </div>
        )}

        {status === 'submitting' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Submitting your report...</p>
          </div>
        )}

        {status === 'done' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900">Report Submitted</h1>
              <p className="text-gray-600 mt-2">
                The renter&apos;s deposit has been <strong>frozen</strong> and will not be automatically refunded.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">What to do next</h2>
              <p className="text-blue-800 mb-4">
                Please email us with your rental details, a description of the damage or issue, and any photos if possible. We will review your report and get back to you.
              </p>
              <a
                href={`mailto:benclarknfk@gmail.com?subject=Damage%20Report%20-%20${encodeURIComponent(decodeURIComponent(toolName))}&body=Rental%20ID%3A%20${rentalId}%0ATool%3A%20${encodeURIComponent(decodeURIComponent(toolName))}%0A%0APlease%20describe%20the%20issue%3A%0A%0A`}
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg text-center"
              >
                📧 Email Us About This Issue
              </a>
              <p className="text-blue-700 text-sm mt-3 text-center">
                Or email directly: <a href="mailto:benclarknfk@gmail.com" className="underline font-semibold">benclarknfk@gmail.com</a>
              </p>
            </div>

            <Link
              href="/dashboard"
              className="block text-center text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900">Something Went Wrong</h1>
              <p className="text-red-600 mt-2">{errorMsg}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-blue-800 mb-3">
                If the report didn&apos;t go through, you can still email us directly and we&apos;ll handle it manually:
              </p>
              <a
                href={`mailto:benclarknfk@gmail.com?subject=Damage%20Report%20-%20${encodeURIComponent(decodeURIComponent(toolName))}&body=Rental%20ID%3A%20${rentalId}%0ATool%3A%20${encodeURIComponent(decodeURIComponent(toolName))}%0A%0APlease%20describe%20the%20issue%3A%0A%0A`}
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg text-center"
              >
                📧 Email Us About This Issue
              </a>
              <p className="text-blue-700 text-sm mt-3 text-center">
                Or email directly: <a href="mailto:benclarknfk@gmail.com" className="underline font-semibold">benclarknfk@gmail.com</a>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStatus('ready'); setErrorMsg(''); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <ReportIssueContent />
    </Suspense>
  );
}
