'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { getSupabase } from '@/lib/supabase';

interface BorrowRequest {
  id: string;
  tool_id: string;
  borrower_id: string;
  status: string;
  borrowed_at: string;
  expected_return: string;
  tool?: {
    name: string;
    image_url: string;
  };
}

export default function ReturnToolPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const toolId = params?.id as string;
  
  const [borrowRequest, setBorrowRequest] = useState<BorrowRequest | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchBorrowRequest = async () => {
      try {
        // Get the active borrow request for this tool (status = 'borrowed')
        const sb = getSupabase();
        const { data, error: fetchError } = await sb
          .from('borrow_requests')
          .select(`
            id,
            tool_id,
            borrower_id,
            status,
            borrowed_at,
            expected_return,
            tools:tool_id(name, image_url)
          `)
          .eq('tool_id', toolId)
          .eq('status', 'borrowed')
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('No active borrow found for this tool');
          } else {
            setError('Failed to load borrow request');
          }
          setPageLoading(false);
          return;
        }

        // Verify the current user is the tool owner
        const { data: toolData, error: toolError } = await sb
          .from('tools')
          .select('owner_id')
          .eq('id', toolId)
          .single();

        if (toolError || !toolData || toolData.owner_id !== session.user?.id) {
          setError('You do not have permission to confirm return for this tool');
          setPageLoading(false);
          return;
        }

        setBorrowRequest(data);
        setPageLoading(false);
      } catch (err) {
        setError('Failed to load borrow request');
        setPageLoading(false);
      }
    };

    fetchBorrowRequest();
  }, [session, toolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!confirmed) {
      setError('Please confirm that the tool has been returned in working condition');
      return;
    }

    if (!borrowRequest) {
      setError('No borrow request found');
      return;
    }

    setSubmitting(true);

    try {
      // Update borrow request status to 'returned'
      const sb = getSupabase();
      const { error: updateError } = await sb
        .from('borrow_requests')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString(),
        })
        .eq('id', borrowRequest.id);

      if (updateError) {

        setError('Failed to confirm return');
        setSubmitting(false);
        return;
      }

      // Redirect to owner dashboard
      router.push('/dashboard?returnConfirmed=true');
    } catch (err) {
      setError('Failed to confirm return');
      setSubmitting(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (!borrowRequest) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'No active borrow request found for this tool'}</p>
          </div>
        </div>
      </div>
    );
  }

  const borrowedDate = borrowRequest.borrowed_at ? new Date(borrowRequest.borrowed_at).toLocaleDateString() : 'N/A';
  const expectedReturn = borrowRequest.expected_return ? new Date(borrowRequest.expected_return).toLocaleDateString() : 'N/A';

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Tool Return</h1>
          <p className="text-gray-600 mb-8">Verify that the borrowed tool has been returned in good condition</p>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Tool Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tool Details</h2>
            <div className="flex gap-4">
              {borrowRequest.tool?.image_url && (
                <img
                  src={borrowRequest.tool.image_url}
                  alt={borrowRequest.tool.name}
                  className="w-24 h-24 object-cover rounded border border-gray-200"
                />
              )}
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900">{borrowRequest.tool?.name}</p>
                <dl className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Borrowed:</dt>
                    <dd className="text-sm font-medium text-gray-900">{borrowedDate}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Expected Return:</dt>
                    <dd className="text-sm font-medium text-gray-900">{expectedReturn}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Days Borrowed:</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {Math.floor((new Date().getTime() - new Date(borrowRequest.borrowed_at).getTime()) / (1000 * 60 * 60 * 24))} days
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Return Confirmation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Condition</h3>
              <p className="text-sm text-gray-700 mb-6">
                Please verify that the tool has been returned in working condition. Damage claims must be reported within 48 hours of return.
              </p>
              
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  <strong>I confirm</strong> that the tool has been returned in working condition and is ready for the next borrower.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || !confirmed}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Confirming...' : 'Confirm Return'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50 text-center transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
