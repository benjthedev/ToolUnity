'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/app/utils/toast';

interface Rental {
  id: string;
  tool_id: string;
  start_date: string;
  end_date: string;
  status: string;
  rental_cost: number;
  daily_rate?: number;
  owner_id?: string;
  deposit_amount?: number;
  deposit_status?: string;
  return_confirmed_at?: string;
  claim_window_ends_at?: string;
  deposit_claim_reason?: string;
  tools?: { 
    name: string;
    owner_id: string;
  } | null;
  owner?: {
    email: string;
    phone_number: string | null;
    username: string | null;
  } | null;
}

interface Tool {
  id: string;
  name: string;
  category: string;
  available: boolean;
  daily_rate: number;
  owner_id: string;
}

interface RentalRequest {
  id: string;
  tool_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  daily_rate: number;
  rental_cost: number;
  total_cost: number;
  notes?: string | null;
  status: string;
  created_at: string;
  tools?: { name: string } | null;
  renter?: { email: string; phone_number?: string | null; full_name?: string | null } | null;
}

export default function DashboardPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [activeRentals, setActiveRentals] = useState<Rental[]>([]);
  const [pendingRentals, setPendingRentals] = useState<Rental[]>([]);
  const [pendingApprovalRentals, setPendingApprovalRentals] = useState<Rental[]>([]);
  const [returnedRentals, setReturnedRentals] = useState<Rental[]>([]);
  const [ownerRentals, setOwnerRentals] = useState<Rental[]>([]);
  const [ownerReturnedRentals, setOwnerReturnedRentals] = useState<Rental[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [claimReason, setClaimReason] = useState<string>('');
  const [claimingRentalId, setClaimingRentalId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [session?.user?.id, loading, router]);

  const fetchData = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoadingData(true);

      // Fetch user's rentals (tools they rented) with owner details
      const { data: rentalData } = await supabase
        .from('rental_transactions')
        .select(`
          *,
          tools(name, owner_id),
          owner:owner_id(email, phone_number, username)
        `)
        .eq('renter_id', session.user.id)
        .order('start_date', { ascending: false });

      if (rentalData) {
        setActiveRentals(rentalData.filter((r: Rental) => r.status === 'active') || []);
        setPendingRentals(rentalData.filter((r: Rental) => r.status === 'pending_payment') || []);
        setPendingApprovalRentals(rentalData.filter((r: Rental) => r.status === 'pending_approval') || []);
        setReturnedRentals(rentalData.filter((r: Rental) => r.status === 'returned' && r.deposit_status && r.deposit_status !== 'none' && r.deposit_status !== 'released' && r.deposit_status !== 'refunded') || []);
      }

      // Fetch owner's tools
      const { data: toolsData } = await supabase
        .from('tools')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });

      if (toolsData) {
        setTools(toolsData || []);

        // Fetch rentals of their tools
        if (toolsData.length > 0) {
          const toolIds = toolsData.map((t: any) => t.id);
          
          const { data: ownerRentalsData } = await supabase
            .from('rental_transactions')
            .select('*, tools(name), renter:renter_id(email, phone_number, username)')
            .in('tool_id', toolIds)
            .in('status', ['active', 'pending_approval', 'pending_payment', 'returned'])
            .order('start_date', { ascending: false });

          if (ownerRentalsData) {
            setOwnerRentals(ownerRentalsData.filter((r: any) => ['active', 'pending_approval', 'pending_payment'].includes(r.status)) || []);
            setOwnerReturnedRentals(ownerRentalsData.filter((r: any) => r.status === 'returned' && r.deposit_status && r.deposit_status !== 'none' && r.deposit_status !== 'released' && r.deposit_status !== 'refunded') || []);
          }
        }
      }

      // Fetch user's bank details
      const { data: userDetails } = await supabase
        .from('users_ext')
        .select('bank_account_number')
        .eq('user_id', session.user.id)
        .single();

      if (userDetails?.bank_account_number) {
        setHasBankDetails(true);
      } else {
        setHasBankDetails(false);
      }

      // Fetch rental requests for owner's tools
      const requestsResponse = await fetch('/api/owner/requests');
      if (requestsResponse.ok) {
        const requestsJson = await requestsResponse.json();
        setRentalRequests(requestsJson.requests || []);
      }

      // Fetch CSRF token
      const csrfResponse = await fetch('/api/auth/csrf');
      if (csrfResponse.ok) {
        const csrfData = await csrfResponse.json();
        setCsrfToken(csrfData.csrfToken);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleReturn = async (rentalId: string) => {
    try {
      // Calculate claim window end date (7 days from now)
      const claimWindowEnd = new Date();
      claimWindowEnd.setDate(claimWindowEnd.getDate() + 7);

      const { error } = await supabase
        .from('rental_transactions')
        .update({
          status: 'returned',
          end_date: new Date().toISOString().split('T')[0],
          return_confirmed_at: new Date().toISOString(),
          claim_window_ends_at: claimWindowEnd.toISOString(),
          deposit_status: 'pending_release',
        })
        .eq('id', rentalId)
        .eq('renter_id', session?.user?.id || '');

      if (error) throw error;

      showToast('Tool returned successfully! Your deposit will be refunded within 7 days if no issues are reported.', 'success');
      fetchData();
    } catch (err) {
      console.error('Error returning tool:', err);
      showToast('Failed to return tool', 'error');
    }
  };

  const handleDepositClaim = async (rentalId: string) => {
    if (!claimReason || claimReason.trim().length < 10) {
      showToast('Please describe the damage in at least 10 characters', 'error');
      return;
    }

    setProcessingRequest(rentalId);
    try {
      const response = await fetch('/api/deposits/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rental_id: rentalId, reason: claimReason }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit claim');

      showToast('Damage claim submitted. An admin will review it.', 'success');
      setClaimingRentalId(null);
      setClaimReason('');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit claim', 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool? Any rental requests will be cancelled.')) return;

    try {
      // First, delete any rental requests for this tool (only for tools owned by current user)
      const { error: requestsError } = await supabase
        .from('rental_transactions')
        .delete()
        .eq('tool_id', toolId)
        .eq('owner_id', session?.user?.id || '');

      if (requestsError) {
        console.warn('Warning: Could not delete rental requests:', requestsError);
        // Continue anyway - try to delete the tool
      }

      // Then delete the tool (only if owned by current user)
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId)
        .eq('owner_id', session?.user?.id || '');

      if (error) throw error;

      showToast('Tool deleted successfully', 'success');
      fetchData();
    } catch (err) {
      console.error('Error deleting tool:', err);
      showToast('Failed to delete tool', 'error');
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      return;
    }

    setProcessingRequest(requestId);
    try {
      const response = await fetch('/api/owner/requests/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rental_id: requestId,
          csrf_token: csrfToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept request');
      }

      showToast('Rental request accepted! Contact info is now shared with the renter.', 'success');
      await fetchData();
    } catch (err: any) {
      console.error('Error accepting request:', err);
      showToast(err.message || 'Failed to accept request', 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!csrfToken) {
      showToast('Security token missing. Please refresh the page.', 'error');
      return;
    }

    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    setProcessingRequest(requestId);
    try {
      const response = await fetch('/api/owner/requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rental_id: requestId,
          reason: reason || 'Tool owner declined request',
          csrf_token: csrfToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      showToast('Rental request rejected. Refund has been issued to the renter.', 'success');
      await fetchData();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      showToast(err.message || 'Failed to reject request', 'error');
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalEarningsPotential = tools.length > 0 
    ? ownerRentals.reduce((sum, r) => sum + (r.rental_cost || 0), 0) * 0.80
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
          </div>
          <p className="text-blue-100 mt-2">Manage your rentals and tools</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Setup Payouts Banner */}
        {tools.length > 0 && !hasBankDetails && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💰</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Earn Money?</h3>
                <p className="text-gray-700 mb-4">
                  Add your bank details to receive payouts from tool rentals. You'll get 80% of each rental to your account.
                </p>
                <Link
                  href="/setup-payouts"
                  className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-semibold transition-colors"
                >
                  → Set Up Payouts
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {(activeRentals.length > 0 || tools.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-2">Active Rentals</p>
              <p className="text-4xl font-bold text-blue-600">{activeRentals.length}</p>
              <p className="text-gray-500 text-xs mt-2">Tools you're currently renting</p>
            </div>

            {tools.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Tools Listed</p>
                <p className="text-4xl font-bold text-green-600">{tools.length}</p>
                <p className="text-gray-500 text-xs mt-2">Available for others to rent</p>
              </div>
            )}

            {tools.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <p className="text-gray-600 text-sm mb-2">Active Tool Rentals</p>
                <p className="text-4xl font-bold text-purple-600">{ownerRentals.length}</p>
                <p className="text-gray-500 text-xs mt-2">Being rented by others</p>
              </div>
            )}
          </div>
        )}

        {/* RENTER SECTION */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Rentals</h2>
            <Link href="/tools" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Browse More Tools →
            </Link>
          </div>

          {loadingData ? (
            <p className="text-gray-600">Loading...</p>
          ) : pendingRentals.length > 0 || pendingApprovalRentals.length > 0 || activeRentals.length > 0 ? (
            <>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Pending Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingRentals.map((rental) => (
                    <div key={rental.id} className="bg-white rounded-lg border border-yellow-200 overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border-b border-yellow-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">Awaiting payment confirmation</p>
                          </div>
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">
                            ⏳ Pending
                          </span>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">From</p>
                            <p className="font-semibold text-gray-900">{rental.start_date}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Until</p>
                            <p className="font-semibold text-gray-900">{rental.end_date}</p>
                          </div>
                        </div>
                        {rental.rental_cost && (
                          <div className="bg-blue-50 rounded p-3 text-sm">
                            <p className="text-gray-600">Rental Cost</p>
                            <p className="font-semibold text-blue-600">£{rental.rental_cost.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {pendingApprovalRentals.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Awaiting Owner Acceptance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingApprovalRentals.map((rental) => (
                      <div key={rental.id} className="bg-white rounded-lg border border-blue-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-blue-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                              <p className="text-gray-600 text-sm mt-1">Payment confirmed ✓</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">
                              ⏳ Awaiting Approval
                            </span>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                            The tool owner is reviewing your rental request. You'll get a notification once they accept or decline.
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">From</p>
                              <p className="font-semibold text-gray-900">{rental.start_date}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Until</p>
                              <p className="font-semibold text-gray-900">{rental.end_date}</p>
                            </div>
                          </div>
                          {rental.rental_cost && (
                            <div className="bg-green-50 rounded p-3 text-sm">
                              <p className="text-gray-600">Rental Cost (Paid)</p>
                              <p className="font-semibold text-green-600">£{rental.rental_cost.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeRentals.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Rentals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeRentals.map((rental) => (
                      <div key={rental.id} className="bg-white rounded-lg border border-green-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                              <p className="text-gray-600 text-sm mt-1">£{rental.daily_rate || 0}/day</p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                              ✓ Active
                            </span>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          {/* Owner Contact Details */}
                          {rental.owner && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">📞 Owner Contact Details</h4>
                              {rental.owner.username && (
                                <p className="text-gray-700 text-sm">👤 {rental.owner.username}</p>
                              )}
                              <p className="text-gray-700 text-sm">
                                ✉️ <a href={`mailto:${rental.owner.email}`} className="text-blue-600 hover:underline">{rental.owner.email}</a>
                              </p>
                              {rental.owner.phone_number && (
                                <p className="text-gray-700 text-sm">
                                  📱 <a href={`tel:${rental.owner.phone_number}`} className="text-blue-600 hover:underline">{rental.owner.phone_number}</a>
                                </p>
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">From</p>
                              <p className="font-semibold text-gray-900">{rental.start_date}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Until</p>
                              <p className="font-semibold text-gray-900">{rental.end_date}</p>
                            </div>
                          </div>
                          {rental.rental_cost && (
                            <div className="bg-blue-50 rounded p-3 text-sm">
                              <p className="text-gray-600">Rental Cost</p>
                              <p className="font-semibold text-blue-600">£{rental.rental_cost.toFixed(2)}</p>
                            </div>
                          )}
                          {rental.deposit_amount && rental.deposit_amount > 0 && (
                            <div className="bg-amber-50 rounded p-3 text-sm border border-amber-200">
                              <p className="text-gray-600">🛡️ Refundable Deposit</p>
                              <p className="font-semibold text-amber-700">£{rental.deposit_amount.toFixed(2)}</p>
                              <p className="text-xs text-gray-500 mt-1">Returned within 7 days after you return the tool (if no damage reported)</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleReturn(rental.id)}
                            className="w-full bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-semibold transition"
                          >
                            Mark as Returned
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Returned Rentals - Deposit Pending */}
              {returnedRentals.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Returned - Deposit Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {returnedRentals.map((rental) => (
                      <div key={rental.id} className="bg-white rounded-lg border border-amber-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 border-b border-amber-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                              <p className="text-gray-600 text-sm mt-1">Tool returned ✓</p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              rental.deposit_status === 'pending_release' ? 'bg-amber-100 text-amber-800' :
                              rental.deposit_status === 'claimed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {rental.deposit_status === 'pending_release' ? '⏳ Deposit Pending' :
                               rental.deposit_status === 'claimed' ? '⚠️ Claim Under Review' :
                               rental.deposit_status === 'held' ? '🔒 Deposit Held' :
                               rental.deposit_status}
                            </span>
                          </div>
                        </div>
                        <div className="p-6 space-y-3">
                          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                            <p className="text-gray-700">
                              <strong>Deposit: £{rental.deposit_amount?.toFixed(2) || '10.00'}</strong>
                            </p>
                            {rental.deposit_status === 'pending_release' && rental.claim_window_ends_at && (
                              <p className="text-gray-600 text-xs mt-1">
                                Auto-refund after: {new Date(rental.claim_window_ends_at).toLocaleDateString('en-GB')}
                              </p>
                            )}
                            {rental.deposit_status === 'claimed' && (
                              <p className="text-red-700 text-xs mt-1">
                                The owner has reported damage. An admin is reviewing your deposit.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : activeRentals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRentals.map((rental) => (
                <div key={rental.id} className="bg-white rounded-lg border border-green-200 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">£{rental.daily_rate || 0}/day</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                        ✓ Active
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Owner Contact Details */}
                    {rental.owner && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📞 Owner Contact Details</h4>
                        {rental.owner.username && (
                          <p className="text-gray-700 text-sm">👤 {rental.owner.username}</p>
                        )}
                        <p className="text-gray-700 text-sm">
                          ✉️ <a href={`mailto:${rental.owner.email}`} className="text-blue-600 hover:underline">{rental.owner.email}</a>
                        </p>
                        {rental.owner.phone_number && (
                          <p className="text-gray-700 text-sm">
                            📱 <a href={`tel:${rental.owner.phone_number}`} className="text-blue-600 hover:underline">{rental.owner.phone_number}</a>
                          </p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">From</p>
                        <p className="font-semibold text-gray-900">{rental.start_date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Until</p>
                        <p className="font-semibold text-gray-900">{rental.end_date}</p>
                      </div>
                    </div>
                    {rental.rental_cost && (
                      <div className="bg-blue-50 rounded p-3 text-sm">
                        <p className="text-gray-600">Rental Cost</p>
                        <p className="font-semibold text-blue-600">£{rental.rental_cost.toFixed(2)}</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleReturn(rental.id)}
                      className="w-full bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-semibold transition"
                    >
                      Mark as Returned
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-600 mb-4 font-medium">No active rentals</p>
              <Link href="/tools" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold">
                Browse Tools
              </Link>
            </div>
          )}
        </section>

        {/* OWNER SECTION */}
        {tools.length > 0 && (
          <>
            {/* Active Rentals of Your Tools */}
            {ownerRentals.length > 0 && (
              <section className="border-t pt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Tools Being Rented</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ownerRentals.map((rental) => {
                    // Find matching rental request for more details
                    const matchingRequest = rentalRequests.find(r => r.id === rental.id);
                    const displayData = matchingRequest || rental;
                    
                    return (
                      <div key={rental.id} className={`bg-white rounded-lg border overflow-hidden shadow-sm ${
                        rental.status === 'active' ? 'border-green-200' : 
                        rental.status === 'pending_approval' ? 'border-yellow-200' : 'border-gray-200'
                      }`}>
                        <div className={`p-6 border-b ${
                          rental.status === 'active' 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                            : rental.status === 'pending_approval'
                              ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                              : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              rental.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : rental.status === 'pending_approval'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rental.status === 'active' ? '✓ Rented' : 
                               rental.status === 'pending_approval' ? '⏳ Awaiting Approval' : 
                               rental.status === 'pending_payment' ? '💳 Payment Pending' : rental.status}
                            </span>
                          </div>
                          {matchingRequest?.renter?.email && (
                            <div className="space-y-1">
                              <p className="text-gray-600 text-sm">Requested by: {matchingRequest.renter.email}</p>
                              {matchingRequest.renter.phone_number && (
                                <p className="text-gray-600 text-sm">
                                  Phone: <a href={`tel:${matchingRequest.renter.phone_number}`} className="text-blue-600 hover:underline">{matchingRequest.renter.phone_number}</a>
                                </p>
                              )}
                            </div>
                          )}
                          {rental.status === 'active' && matchingRequest?.renter && (
                            <div className="mt-2 space-y-1">
                              {matchingRequest.renter.phone_number && (
                                <p className="text-blue-600 text-sm font-semibold">
                                  <a href={`tel:${matchingRequest.renter.phone_number}`} className="hover:underline">
                                    📞 {matchingRequest.renter.phone_number}
                                  </a>
                                </p>
                              )}
                              {matchingRequest.renter.full_name && (
                                <p className="text-gray-700 text-sm">👤 {matchingRequest.renter.full_name}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-6 space-y-4">
                          {matchingRequest?.notes && (
                            <div className="bg-gray-50 rounded p-3 text-sm">
                              <p className="text-gray-700">{matchingRequest.notes}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">From</p>
                              <p className="font-semibold text-gray-900">{new Date(rental.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Until</p>
                              <p className="font-semibold text-gray-900">{new Date(rental.end_date).toLocaleDateString()}</p>
                            </div>
                            {matchingRequest?.duration_days && (
                              <div>
                                <p className="text-gray-600">Duration</p>
                                <p className="font-semibold text-gray-900">{matchingRequest.duration_days} {matchingRequest.duration_days === 1 ? 'day' : 'days'}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-600">You Earn (80%)</p>
                              <p className={`font-semibold ${rental.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                                £{((matchingRequest?.rental_cost || rental.rental_cost || 0) * 0.80).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {rental.status === 'pending_approval' && (
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => handleApprove(rental.id)}
                                disabled={processingRequest === rental.id}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingRequest === rental.id ? 'Processing...' : '✓ Accept'}
                              </button>
                              <button
                                onClick={() => handleReject(rental.id)}
                                disabled={processingRequest === rental.id}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingRequest === rental.id ? 'Processing...' : '✗ Reject & Refund'}
                              </button>
                            </div>
                          )}
                          {rental.status === 'active' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                              ✓ Rental active - Contact information shared with renter
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Your Tools */}
            {/* Returned Tools - Deposit Claims (Owner) */}
            {ownerReturnedRentals.length > 0 && (
              <section className="border-t pt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Returned Tools - Deposit Review</h2>
                <p className="text-gray-600 mb-4 text-sm">Tools that have been returned. You have 7 days to inspect and report any damage.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ownerReturnedRentals.map((rental) => {
                    const claimWindowEnd = rental.claim_window_ends_at ? new Date(rental.claim_window_ends_at) : null;
                    const daysLeft = claimWindowEnd ? Math.max(0, Math.ceil((claimWindowEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                    const isExpired = claimWindowEnd && claimWindowEnd < new Date();

                    return (
                      <div key={rental.id} className="bg-white rounded-lg border border-amber-200 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 border-b border-amber-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                              <p className="text-gray-600 text-sm mt-1">Returned on {rental.return_confirmed_at ? new Date(rental.return_confirmed_at).toLocaleDateString('en-GB') : 'recently'}</p>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              rental.deposit_status === 'pending_release' ? 'bg-amber-100 text-amber-800' :
                              rental.deposit_status === 'claimed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {rental.deposit_status === 'pending_release' ? `⏳ ${daysLeft} days left to inspect` :
                               rental.deposit_status === 'claimed' ? '📋 Claim Under Review' :
                               rental.deposit_status === 'held' ? '🔒 Deposit Held' :
                               rental.deposit_status}
                            </span>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                            <p className="font-semibold text-gray-900">Deposit: £{rental.deposit_amount?.toFixed(2) || '10.00'}</p>
                            {!isExpired && rental.deposit_status === 'pending_release' && (
                              <p className="text-amber-700 text-xs mt-1">
                                You have {daysLeft} day{daysLeft !== 1 ? 's' : ''} to report damage. After that, the deposit is automatically refunded to the renter.
                              </p>
                            )}
                          </div>

                          {rental.deposit_status === 'pending_release' && !isExpired && (
                            <>
                              {claimingRentalId === rental.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    placeholder="Describe the damage in detail (min 10 characters)..."
                                    rows={3}
                                    value={claimReason}
                                    onChange={(e) => setClaimReason(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDepositClaim(rental.id)}
                                      disabled={processingRequest === rental.id}
                                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold text-sm disabled:opacity-50 transition"
                                    >
                                      {processingRequest === rental.id ? 'Submitting...' : 'Submit Damage Claim'}
                                    </button>
                                    <button
                                      onClick={() => { setClaimingRentalId(null); setClaimReason(''); }}
                                      className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-300 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => setClaimingRentalId(rental.id)}
                                    className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-semibold text-sm transition"
                                  >
                                    ⚠️ Report Damage
                                  </button>
                                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg py-2 px-3 text-center text-sm text-green-700">
                                    ✓ No damage? Deposit auto-refunds
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {rental.deposit_status === 'claimed' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                              <p className="font-semibold text-red-800 mb-1">Your claim is under review</p>
                              <p className="text-red-700 text-xs">{rental.deposit_claim_reason}</p>
                              <p className="text-gray-600 text-xs mt-2">An admin will review and decide. You'll be notified of the outcome.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Your Tools List */}
            <section className="border-t pt-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Tools</h2>
                <Link
                  href="/tools/add"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm"
                >
                  + Add Tool
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                  <div key={tool.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{tool.category}</p>
                      
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-gray-600 text-xs mb-1">Daily Rate</p>
                        <p className="text-2xl font-bold text-blue-600">£{tool.daily_rate || 0}</p>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/tools/${tool.id}`}
                          className="flex-1 text-center bg-blue-100 text-blue-900 py-2 rounded hover:bg-blue-200 text-sm font-semibold transition"
                        >
                          View
                        </Link>
                        <Link
                          href={`/tools/${tool.id}/edit`}
                          className="flex-1 text-center bg-gray-100 text-gray-900 py-2 rounded hover:bg-gray-200 text-sm font-semibold transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="flex-1 text-center bg-red-100 text-red-900 py-2 rounded hover:bg-red-200 text-sm font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Empty State */}
        {!loadingData && activeRentals.length === 0 && tools.length === 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-12 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to ToolUnity</h3>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
              Start by browsing tools to rent, or list your own tools to earn money when others rent them. You get 80% of every rental!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tools" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                Browse Tools
              </Link>
              <Link href="/tools/add" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
                List Your First Tool
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
