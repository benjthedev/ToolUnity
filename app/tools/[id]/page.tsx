'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { getSupabase } from '@/lib/supabase';
import { fetchWithCsrf } from '@/app/utils/csrf-client';
import { showToast } from '@/app/utils/toast';
import { sanitizeHtml } from '@/lib/sanitizer';

export default function ToolDetailPage() {
  const { session } = useAuth();
  const params = useParams();
  const router = useRouter();
  const toolId = params.id as string;

  const [tool, setTool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerToolsCount, setOwnerToolsCount] = useState(0);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowData, setBorrowData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [borrowSuccess, setBorrowSuccess] = useState<any>(null);
  const [borrowError, setBorrowError] = useState<any>(null);
  const [submittingBorrow, setSubmittingBorrow] = useState(false);

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const sb = getSupabase();
        // Fetch tool
        const { data: toolData, error: toolError } = await sb
          .from('tools')
          .select('*')
          .eq('id', toolId)
          .single();

        if (toolError || !toolData) {
          setTool(null);
          setLoading(false);
          return;
        }

        setTool(toolData);

        // Fetch owner data separately
        if (toolData.owner_id) {
          const { data: ownerData } = await sb
            .from('users_ext')
            .select('user_id, username, email, tools_count')
            .eq('user_id', toolData.owner_id)
            .single();
          
          if (ownerData) {
            setOwnerName(ownerData.username || ownerData.email?.split('@')[0] || 'Unknown Owner');
            setOwnerToolsCount(ownerData.tools_count || 0);
          }
        }
      } catch (err) {
        setTool(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [toolId]);

  // Check email verification status when session changes
  useEffect(() => {
    if (!session?.user?.id) return;

    const checkVerification = async () => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb
          .from('users_ext')
          .select('email_verified')
          .eq('user_id', session.user.id)
          .single();

        if (error || !data?.email_verified) {
          setIsVerified(false);
          router.push(`/verify-email?email=${encodeURIComponent(session.user?.email || '')}`);
          return;
        }
        
        setIsVerified(true);
      } catch (err) {
        setIsVerified(false);
        router.push(`/verify-email?email=${encodeURIComponent(session.user?.email || '')}`);
      }
    };

    checkVerification();
  }, [session, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading tool details...</p>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pt-32 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tool not found</h1>
          <Link href="/tools" className="text-blue-600 hover:text-blue-700 font-semibold">
            Back to tools
          </Link>
        </div>
      </div>
    );
  }

  const handleShowBorrowForm = async () => {
    setShowBorrowForm(!showBorrowForm);
    if (!showBorrowForm) {
      setBorrowError(null);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const handleCloseModal = () => {
    setShowBorrowForm(false);
    setBorrowError(null);
    document.body.style.overflow = 'unset';
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBorrow(true);
    setBorrowError(null);

    // Check if user is verified (from database check)
    if (!isVerified) {
      setBorrowError({
        message: 'Please verify your email before renting tools',
        reason: 'email_not_verified',
      });
      setSubmittingBorrow(false);
      return;
    }

    // Validate dates client-side before submission
    const start = new Date(borrowData.startDate);
    const end = new Date(borrowData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setBorrowError({
        message: 'Start date cannot be in the past',
        reason: 'invalid_date',
      });
      setSubmittingBorrow(false);
      return;
    }

    if (end <= start) {
      setBorrowError({
        message: 'End date must be after start date',
        reason: 'invalid_date',
      });
      setSubmittingBorrow(false);
      return;
    }

    // Validate eligibility with the server before creating request
    try {
      const validationResponse = await fetchWithCsrf('/api/borrow/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toolId,
          startDate: borrowData.startDate,
          endDate: borrowData.endDate,
        }),
      });

      const validationResult = await validationResponse.json();

      if (!validationResponse.ok || !validationResult.canBorrow) {
        setBorrowError(validationResult);
        setSubmittingBorrow(false);
        return;
      }

      // Validation passed, now create the borrow request
      const response = await fetchWithCsrf('/api/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toolId,
          startDate: borrowData.startDate,
          endDate: borrowData.endDate,
          notes: borrowData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBorrowError(data);
        setSubmittingBorrow(false);
        return;
      }

      // Now create Stripe checkout session
      try {
        const checkoutResponse = await fetchWithCsrf('/api/rental-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            rentalTransactionId: data.rentalId,
          }),
        });

        const checkoutData = await checkoutResponse.json();

        if (!checkoutResponse.ok || !checkoutData.url) {
          setBorrowError({
            message: 'Failed to create payment session',
            reason: 'checkout_failed',
          });
          setSubmittingBorrow(false);
          return;
        }

        // Redirect to Stripe checkout
        window.location.href = checkoutData.url;
      } catch (checkoutError) {
        setBorrowError({
          message: 'Failed to redirect to payment',
          reason: 'redirect_failed',
        });
        showToast('Failed to redirect to payment', 'error');
      }
    } catch (error) {
      setBorrowError({
        message: 'An error occurred. Please try again.',
        reason: 'network_error',
      });
      showToast('Failed to submit borrow request', 'error');
    } finally {
      setSubmittingBorrow(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pt-32">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/tools" className="text-blue-600 hover:text-blue-700 mb-6 inline-block font-semibold">
          ← Back to Tools
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tool Image */}
            <div className="md:col-span-1">
              {tool.image_url ? (
                <img
                  src={tool.image_url}
                  alt={tool.name}
                  className="w-full h-80 rounded-lg mb-6 bg-gray-200 object-cover"
                />
              ) : (
                <div className="w-full h-80 rounded-lg mb-6 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-6xl">
                  📦
                </div>
              )}
              
              {/* Info Card */}
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Condition</p>
                  <p className="text-lg font-semibold text-gray-900">{tool.condition}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Location</p>
                  <p className="text-lg font-semibold text-gray-900">📍 {tool.postcode}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-2">Owner</p>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-gray-900">{ownerName}</p>
                    {ownerToolsCount >= 3 && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                        ⭐ Top Owner
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
                  <p className="text-sm mb-1">Tool Value</p>
                  <p className="text-3xl font-bold">£{tool.tool_value}</p>
                </div>
              </div>
            </div>

            {/* Tool Details */}
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{tool.name}</h1>
              <p className="text-lg text-gray-600 mb-6">{tool.category}</p>

              <div className="mb-6 flex items-center gap-4">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    tool.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {tool.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {/* Rental Pricing Info - Always Show */}
              {session && session.user?.id !== tool.owner_id && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">💰</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-3">Rental Price</h3>
                      <div className="bg-white rounded p-3 mb-3">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>£{tool?.daily_rate || '3.00'} per day</strong>
                        </p>
                        <p className="text-xs text-gray-600">
                          Select dates below to see your total rental cost
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">
                        ✓ No membership required—just pay for what you rent
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {session && session.user?.id !== tool.owner_id ? (
                <button
                  onClick={handleShowBorrowForm}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-8"
                >
                  Rent This Tool
                </button>
              ) : !session ? (
                <Link
                  href="/login"
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-8"
                >
                  Sign in to Rent
                </Link>
              ) : !session.user?.emailVerified ? (
                <div className="mb-8">
                  <button
                    disabled
                    className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold cursor-not-allowed mb-3"
                  >
                    Email Verification Required
                  </button>
                  <p className="text-sm text-gray-600 text-center">
                    Please{' '}
                    <Link href="/verify-email" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                      verify your email
                    </Link>
                    {' '}before renting tools.
                  </p>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed mb-8"
                >
                  You own this tool
                </button>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About this tool</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{sanitizeHtml(tool.description)}</p>
              </div>

              {/* Rental Pricing Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">How Rental Works</h3>
                <div className="bg-white p-4 rounded border border-green-300 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Daily Rental Rate</p>
                  <p className="text-2xl font-bold text-green-600">£{tool?.daily_rate || '3.00'}/day</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">✓ What's Included</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• No hidden fees—you see the total before paying</li>
                    <li>• Owner gets 85% of rental, ToolUnity keeps 15%</li>
                    <li>• Flexible rental periods—rent for 1 day or longer</li>
                    <li>• Contact owner directly for questions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Borrow Form Modal */}
          {showBorrowForm && session?.user?.id !== tool.owner_id && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-gray-900 bg-opacity-40"
                onClick={handleCloseModal}
              />
              
              {/* Modal Content */}
              <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {borrowError ? (
                  <div className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">❌</div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-red-900 mb-2">{borrowError.error || 'Cannot Rent This Tool'}</h2>
                        <p className="text-red-800 mb-4 text-lg">{borrowError.message}</p>
                        <button
                          onClick={() => {
                            setBorrowError(null);
                            setBorrowData({ startDate: '', endDate: '', notes: '' });
                          }}
                          className="mt-4 text-red-600 hover:text-red-700 font-semibold underline"
                        >
                          Try Different Dates
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* Modal Header */}
                    <div className="mb-6 pr-8">
                      <h2 className="text-2xl font-bold text-gray-900">Rent This Tool</h2>
                      <p className="text-gray-600 mt-1">{tool.name}</p>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Daily Rate</span>
                        <span className="text-xl font-bold text-green-600">£{tool?.daily_rate || '3.00'}/day</span>
                      </div>
                    </div>

                    <form onSubmit={handleBorrowSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={borrowData.startDate}
                          onChange={(e) =>
                            setBorrowData({ ...borrowData, startDate: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          End Date *
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={borrowData.endDate}
                          onChange={(e) =>
                            setBorrowData({ ...borrowData, endDate: e.target.value })
                          }
                        />
                      </div>

                      {/* Show rental cost if dates are selected */}
                      {borrowData.startDate && borrowData.endDate && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          {
                            (() => {
                              const start = new Date(borrowData.startDate);
                              const end = new Date(borrowData.endDate);
                              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                              const dailyRate = tool?.daily_rate || 3;
                              const rentalCost = (dailyRate * days).toFixed(2);
                              
                              if (days <= 0) {
                                return <p className="text-red-600 text-sm">End date must be after start date</p>;
                              }
                              
                              return (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-700">{days} day{days !== 1 ? 's' : ''} × £{dailyRate}</span>
                                  <span className="text-2xl font-bold text-blue-600">£{rentalCost}</span>
                                </div>
                              );
                            })()
                          }
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Message to Owner (optional)
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          value={borrowData.notes}
                          onChange={(e) =>
                            setBorrowData({ ...borrowData, notes: e.target.value })
                          }
                          placeholder="Any questions or pickup preferences..."
                        />
                      </div>

                      {/* Responsibility Note */}
                      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                        <p>🛡️ Max liability: £{tool.tool_value} (tool value). You're responsible for returning the tool in working condition.</p>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={submittingBorrow}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {submittingBorrow ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rental Success State */}
          {borrowSuccess && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-8 mt-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-bold text-green-900 mb-3">Rental Request Sent!</h2>
                <p className="text-lg text-gray-700">Your rental request has been submitted to the tool owner.</p>
              </div>

              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">✓ Rental Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Rental Period</p>
                    <p className="font-semibold text-gray-900">{borrowSuccess.startDate} → {borrowSuccess.endDate}</p>
                    <p className="text-xs text-gray-500 mt-1">{borrowSuccess.rentalDays} day{borrowSuccess.rentalDays !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Rental Cost</p>
                    <p className="text-xl font-bold text-green-600">£{borrowSuccess.rentalCost}</p>
                    <p className="text-xs text-gray-500 mt-1">£{borrowSuccess.dailyRate}/day × {borrowSuccess.rentalDays} days</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>What happens next?</strong> The owner will review your request and respond soon. You'll see updates on your dashboard, and we'll notify you once they respond.
                </p>
              </div>

              <div className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="flex-1 text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  View Dashboard →
                </Link>
                <button
                  onClick={() => {
                    setBorrowSuccess(null);
                    setBorrowData({ startDate: '', endDate: '', notes: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Browse More Tools
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
