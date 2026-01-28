'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { getSupabase } from '@/lib/supabase';
import { fetchWithCsrf } from '@/app/utils/csrf-client';
import TierSummary from '@/app/components/TierSummary';
import ToolOwnerBadge from '@/app/components/ToolOwnerBadge';
import { showToast } from '@/app/utils/toast';
import { sanitizeHtml } from '@/lib/sanitizer';

export default function ToolDetailPage() {
  const { session } = useAuth();
  const params = useParams();
  const toolId = params.id as string;

  const [tool, setTool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [ownerToolsCount, setOwnerToolsCount] = useState(0);
  const [ownerSubscriptionTier, setOwnerSubscriptionTier] = useState('none');
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowData, setBorrowData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [borrowSuccess, setBorrowSuccess] = useState<any>(null);
  const [borrowError, setBorrowError] = useState<any>(null);
  const [submittingBorrow, setSubmittingBorrow] = useState(false);
  const [userPaymentInfo, setUserPaymentInfo] = useState<any>(null);
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [userToolsCount, setUserToolsCount] = useState(0);
  const [userIsPaidTier, setUserIsPaidTier] = useState(false);
  const [userActiveBorrows, setUserActiveBorrows] = useState(0);
  const [loadingUserTier, setLoadingUserTier] = useState(true);

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
            .select('user_id, username, email, tools_count, subscription_tier')
            .eq('user_id', toolData.owner_id)
            .single();
          
          if (ownerData) {
            setOwnerName(ownerData.username || ownerData.email?.split('@')[0] || 'Unknown Owner');
            setOwnerToolsCount(ownerData.tools_count || 0);
            setOwnerSubscriptionTier(ownerData.subscription_tier || 'none');
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

  // Fetch user's tier information when logged in
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserTier = async () => {
        try {
          const sb = getSupabase();
          const { data } = await sb
            .from('users_ext')
            .select('subscription_tier, tools_count')
            .eq('user_id', session?.user?.id || '')
            .single();
          
          // Fetch active borrow count
          const { data: activeBorrows } = await sb
            .from('borrow_requests')
            .select('id')
            .eq('user_id', session?.user?.id || '')
            .eq('status', 'approved');
          
          if (data) {
            const subTier = data.subscription_tier || 'none';
            setUserToolsCount(data.tools_count || 0);
            setUserActiveBorrows(activeBorrows?.length || 0);
            
            // Check if paid tier
            const hasPaid = subTier && !['none', 'free'].includes(subTier);
            setUserIsPaidTier(hasPaid);
            
            // Calculate effective tier
            let effectiveTier = subTier;
            if (data.tools_count >= 3) {
              effectiveTier = 'standard';
            } else if (data.tools_count >= 1 && (subTier === 'none' || subTier === 'free' || subTier === 'basic')) {
              effectiveTier = 'basic';
            }
            setUserTier(effectiveTier);
          }
        } catch (err) {
        } finally {
          setLoadingUserTier(false);
        }
      };
      fetchUserTier();
    } else {
      setLoadingUserTier(false);
    }
  }, [session?.user?.id]);

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
    }
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBorrow(true);
    setBorrowError(null);

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

      // Show success state with tier info
      setBorrowSuccess({
        tier: userTier,
        toolValue: tool.tool_value,
        tierLimits: {
          basic: { maxValue: 100, maxBorrows: 1 },
          standard: { maxValue: 300, maxBorrows: 2 },
          pro: { maxValue: 1000, maxBorrows: 5 },
        }[userTier || 'basic'],
        startDate: borrowData.startDate,
        endDate: borrowData.endDate,
      });
      showToast('Borrow request submitted successfully!', 'success');
      setShowBorrowForm(false);
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
                    <ToolOwnerBadge 
                      toolsCount={ownerToolsCount} 
                      subscriptionTier={ownerSubscriptionTier}
                      size="sm"
                    />
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

              {/* Show current tier context before borrow button */}
              {session && session.user?.id !== tool.owner_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">📋</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-3">Your Borrowing Limits</h3>
                      {!loadingUserTier && userTier && userTier !== 'none' ? (
                        <div>
                          <div className="bg-white rounded p-3 mb-3">
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Current tier:</strong> {userTier === 'basic' ? '🛠️ Basic' : userTier === 'standard' ? '⚙️ Standard' : '⭐ Pro'}
                            </p>
                            {userIsPaidTier ? (
                              <p className="text-xs text-blue-700 font-semibold">✓ Paid subscription active</p>
                            ) : (
                              <p className="text-xs text-gray-600">Free tier from listing {userToolsCount} tool{userToolsCount !== 1 ? 's' : ''}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="bg-white rounded p-2">
                              <p className="text-gray-600 text-xs">Active Borrows</p>
                              <p className="font-bold text-gray-900">
                                {userActiveBorrows}/{userTier === 'basic' ? '1' : userTier === 'standard' ? '2' : '5'}
                              </p>
                            </div>
                            <div className="bg-white rounded p-2">
                              <p className="text-gray-600 text-xs">Max Value</p>
                              <p className="font-bold text-gray-900">
                                £{userTier === 'basic' ? '100' : userTier === 'standard' ? '300' : '1000'}
                              </p>
                            </div>
                            <div className="bg-white rounded p-2">
                              <p className="text-gray-600 text-xs">Max Days</p>
                              <p className="font-bold text-gray-900">
                                {userTier === 'basic' ? '3' : userTier === 'standard' ? '7' : '14'}
                              </p>
                            </div>
                          </div>
                          {tool.tool_value && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-700">
                                <strong>This tool:</strong> £{tool.tool_value}
                                {tool.tool_value > (userTier === 'basic' ? 100 : userTier === 'standard' ? 300 : 1000) && (
                                  <span className="text-red-600 ml-2">⚠️ Exceeds your limit</span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700">
                          Join our community to borrow! Subscribe to a plan or list tools to unlock free membership.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {session && session.user?.id !== tool.owner_id ? (
                <button
                  onClick={handleShowBorrowForm}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-8"
                >
                  {showBorrowForm ? 'Cancel' : 'Request to Borrow'}
                </button>
              ) : !session ? (
                <Link
                  href="/login"
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-8"
                >
                  Sign in to Borrow
                </Link>
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

              {/* Borrowing Rules */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Borrowing Rules</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Get access to these tiers two ways: subscribe directly, or list tools. Both paths unlock the same limits.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">Basic</p>
                    <p className="text-xs text-gray-600 mb-3">£2/mo or list 1 tool</p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Max 1 active borrow</li>
                      <li>• Up to £100 value</li>
                      <li>• Up to 3 days</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">Standard</p>
                    <p className="text-xs text-gray-600 mb-3">£10/mo or list 3 tools</p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Max 2 active borrows</li>
                      <li>• Up to £300 value</li>
                      <li>• Up to 7 days</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2">Pro</p>
                    <p className="text-xs text-gray-600 mb-3">£25/mo only</p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Max 5 active borrows</li>
                      <li>• Up to £1,000 value</li>
                      <li>• Up to 14 days</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4">
                  Learn more about our <Link href="/safety" className="text-blue-600 hover:text-blue-700 font-semibold">damage protection and borrowing rules</Link>.
                </p>
              </div>
            </div>
          </div>

          {/* Borrow Form with Error Handling */}
          {showBorrowForm && session?.user?.id !== tool.owner_id && (
            <>
              {borrowError ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 mt-8">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">❌</div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-red-900 mb-2">{borrowError.error || 'Cannot Borrow This Tool'}</h2>
                      <p className="text-red-800 mb-4 text-lg">{borrowError.message}</p>

                      {/* Display detailed help based on error type */}
                      {borrowError.reason === 'no_membership' && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-gray-700 font-semibold mb-3">You need membership to borrow. Here's your path forward:</p>
                          
                          {/* Show TierSummary if available */}
                          {!loadingUserTier && userTier && userTier !== 'none' && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-gray-700 mb-3 font-semibold">📊 Your Current Status</p>
                              <TierSummary
                                effectiveTier={userTier as 'basic' | 'standard' | 'pro'}
                                toolsCount={userToolsCount}
                                isPaidTier={userIsPaidTier}
                                showNextUnlock={true}
                                compact={true}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-blue-300 rounded-lg p-4">
                              <p className="font-semibold text-gray-900 mb-2">Option 1: Subscribe Now</p>
                              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                                <li>• <strong>Basic (£2/mo)</strong>: 1 borrow, £100 value, 3 days</li>
                                <li>• <strong>Standard (£10/mo)</strong>: 2 borrows, £300 value, 7 days</li>
                                <li>• <strong>Pro (£25/mo - Coming Soon)</strong>: 5 borrows, £1,000 value, 14 days</li>
                              </ul>
                              <Link href="/pricing" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">
                                View Plans →
                              </Link>
                            </div>
                            <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                              <p className="font-semibold text-gray-900 mb-2">Option 2: List Tools (Free!)</p>
                              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                                <li>• <strong>1 tool</strong> = Basic free</li>
                                <li>• <strong>3 tools</strong> = Standard free</li>
                                <li>No monthly cost—as long as your tools are listed</li>
                              </ul>
                              <Link href="/tools/add" className="inline-block bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition">
                                List First Tool →
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}

                      {borrowError.reason === 'borrow_limit_reached' && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-gray-700 mb-3">
                            You have <strong>{borrowError.currentBorrows} active borrow{borrowError.currentBorrows !== 1 ? 's' : ''}</strong> (limit: {borrowError.maxBorrows})
                          </p>
                          <p className="text-gray-700 mb-4">{borrowError.suggestedAction}</p>
                          {borrowError.actionType === 'upgrade_to_standard' ? (
                            <Link href="/pricing" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">
                              Upgrade to Standard →
                            </Link>
                          ) : borrowError.actionType === 'upgrade_to_pro' ? (
                            <Link href="/pricing" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">
                              Upgrade to Pro →
                            </Link>
                          ) : null}
                        </div>
                      )}

                      {borrowError.reason === 'value_limit_exceeded' && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-gray-700 mb-3">
                            This tool is worth <strong>£{borrowError.toolValue}</strong>, but your limit is <strong>£{borrowError.userValueLimit}</strong>
                          </p>
                          <p className="text-gray-700 mb-4">{borrowError.suggestedAction}</p>
                          {borrowError.actionType === 'upgrade_to_standard' ? (
                            <Link href="/pricing" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">
                              Upgrade to Standard (£300 limit) →
                            </Link>
                          ) : borrowError.actionType === 'upgrade_to_pro' ? (
                            <Link href="/pricing" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">
                              Upgrade to Pro (£1,000 limit) →
                            </Link>
                          ) : null}
                        </div>
                      )}

                      {borrowError.reason === 'duration_exceeds_limit' && (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-gray-700 mb-3">
                            Your requested duration is <strong>{borrowError.requestedDays} days</strong>, but your limit is <strong>{borrowError.maxDays} days</strong>
                          </p>
                          <p className="text-gray-700 mb-4">{borrowError.suggestedAction}</p>
                          {borrowError.actionType === 'upgrade_to_standard' ? (
                            <Link href="/pricing" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">
                              Upgrade to Standard (7 days) →
                            </Link>
                          ) : borrowError.actionType === 'upgrade_to_pro' ? (
                            <Link href="/pricing" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition">
                              Upgrade to Pro (14 days) →
                            </Link>
                          ) : null}
                        </div>
                      )}

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
                <>
                  {/* How Borrowing Works */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-6 mb-6 mt-8">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">🤝</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-xl mb-3">How Borrowing Works</h3>
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          Borrowing builds trust in our community. You're responsible for normal use, and both parties work together to resolve any disputes fairly.
                        </p>
                        <div className="bg-white rounded-lg p-5 mb-4 border-2 border-gray-200">
                          <p className="font-bold text-gray-900 mb-3 text-lg">Your responsibilities:</p>
                          <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span><strong>Use as intended:</strong> Normal wear is expected. Scratches, dust, and minor wear are part of tool life.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span><strong>Return on time:</strong> Return by the agreed date in working condition.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 font-bold">✓</span>
                              <span><strong>Report damage:</strong> If something happens, report it immediately so we can work it out fairly.</span>
                            </li>
                          </ul>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                          <p className="font-bold text-green-900 mb-2">🛡️ Your Maximum Liability</p>
                          <p className="text-gray-700 text-sm">
                            If significant damage occurs, you're liable for repair costs, capped at the tool's listed value (£{tool.tool_value} for this tool). That's your absolute cap—no surprise fees, no hidden costs.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleBorrowSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-8 mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Request to Borrow</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={borrowData.endDate}
                          onChange={(e) =>
                            setBorrowData({ ...borrowData, endDate: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Notes (optional)
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          value={borrowData.notes}
                          onChange={(e) =>
                            setBorrowData({ ...borrowData, notes: e.target.value })
                          }
                          placeholder="Any special instructions or questions for the owner..."
                        />
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={submittingBorrow}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {submittingBorrow ? 'Sending...' : 'Send Request'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBorrowForm(false)}
                          className="flex-1 bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </>
          )}

          {/* Borrow Success State */}
          {borrowSuccess && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-8 mt-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-3xl font-bold text-green-900 mb-3">Request Sent — Awaiting Approval</h2>
                <p className="text-lg text-gray-700">Your borrow request has been submitted to the tool owner.</p>
              </div>

              <div className="bg-white rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">✓ Confirmed Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Tier Used</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{borrowSuccess.tier}</p>
                    <p className="text-xs text-gray-500 mt-1">Your active membership</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Coverage Limit</p>
                    <p className="text-xl font-bold text-gray-900">Up to £{borrowSuccess.tierLimits?.maxValue}</p>
                    <p className="text-xs text-green-600 mt-1">✓ Tool value £{borrowSuccess.toolValue} within limit</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Borrow Period</p>
                    <p className="font-semibold text-gray-900">{borrowSuccess.startDate} → {borrowSuccess.endDate}</p>
                    <p className="text-xs text-gray-500 mt-1">Pending owner approval</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Protection Status</p>
                    <p className="font-semibold text-green-700">🛡️ Active</p>
                    <p className="text-xs text-gray-500 mt-1">Damage protection applies</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-5 mb-6">
                <p className="font-semibold text-gray-900 mb-2">🛡️ You're Protected</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  ToolUnity's damage protection covers you during this borrow. Normal wear and tear is expected—you'll only be charged if significant damage occurs, and even then, your liability is capped at the tool's value (£{borrowSuccess.toolValue}).
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>What happens next?</strong> The owner will review your request within 24-48 hours. You'll see updates on your dashboard, and we'll notify you once they respond.
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
