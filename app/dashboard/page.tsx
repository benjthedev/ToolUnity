'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import TierSummary from '@/app/components/TierSummary';
import ToolOwnerBadge from '@/app/components/ToolOwnerBadge';
import { showToast } from '@/app/utils/toast';
import { calculateEffectiveTier } from '@/app/utils/tierCalculation';

interface BorrowRequest {
  id: string;
  tool_id: string;
  start_date: string;
  end_date: string;
  status: string;
  tools?: { 
    name: string;
    owner: {
      email: string;
      phone_number: string | null;
    } | null;
  } | null;
  users?: { email: string; phone_number: string | null } | null;
}

interface Tool {
  id: string;
  name: string;
  category: string;
  available: boolean;
  tool_value: number;
  owner_id: string;
}

export default function DashboardPage() {
  const { session, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<BorrowRequest[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [toolsCount, setToolsCount] = useState(0);
  const [effectiveTier, setEffectiveTier] = useState<string>('free');
  const [isPaidTier, setIsPaidTier] = useState(false);
  const [showUnlockCelebration, setShowUnlockCelebration] = useState<string | null>(null);
  const [syncingTier, setSyncingTier] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Check for unlock celebration param
  useEffect(() => {
    const unlocked = searchParams.get('unlocked');
    if (unlocked === 'basic' || unlocked === 'standard') {
      setShowUnlockCelebration(unlocked);
      // Clear the URL param after showing
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Sync subscription with Stripe to get latest status
      try {
        await fetch('/api/sync-subscription', {
          method: 'POST',
        });
      } catch (err) {
        console.error('Error syncing subscription:', err);
      }
      
      // Fetch subscription tier from users_ext
      const { data: userData, error: userError } = await supabase
        .from('users_ext')
        .select('subscription_tier, tools_count')
        .eq('user_id', session?.user?.id)
        .single();

      if (!userError && userData) {
        setSubscriptionTier(userData.subscription_tier || 'free');
        
        // Always recount tools from database to ensure accuracy
        const { data: userTools, error: toolCountError } = await supabase
          .from('tools')
          .select('id', { count: 'exact', head: false })
          .eq('owner_id', session?.user?.id);
        
        const actualToolCount = userTools?.length || userData.tools_count || 0;
        setToolsCount(actualToolCount);
        
        // Use consolidated tier calculation logic with actual tool count
        const tierInfo = calculateEffectiveTier(
          userData.subscription_tier,
          actualToolCount
        );
        console.log('=== TIER CALCULATION DEBUG ===');
        console.log('Input subscriptionTier:', userData.subscription_tier);
        console.log('Input actualToolCount:', actualToolCount);
        console.log('Output effectiveTier:', tierInfo.effectiveTier);
        console.log('Output isFreeTier:', tierInfo.isFreeTier);
        console.log('Output action:', tierInfo.action);
        console.log('==============================');
        
        setEffectiveTier(tierInfo.effectiveTier);
        // isPaidTier is true only if they have a paid subscription (not free tool waiver)
        setIsPaidTier(!tierInfo.isFreeTier && userData.subscription_tier && ['basic', 'standard', 'pro'].includes(userData.subscription_tier));
      }
      
      // Fetch borrow requests where user is the borrower
      const { data: borrowData, error: borrowError } = await supabase
        .from('borrow_requests')
        .select(
          `
          id,
          tool_id,
          start_date,
          end_date,
          status,
          tools:tool_id (
            name,
            owner_id
          )
        `
        )
        .eq('user_id', session?.user?.id)
        .in('status', ['pending', 'approved', 'borrowed', 'returned'])
        .order('created_at', { ascending: false });

      // If we have borrow data, fetch owner details
      let borrowDataWithOwners = borrowData || [];
      if (borrowDataWithOwners.length > 0) {
        const ownerIds = Array.from(new Set(
          borrowDataWithOwners
            .filter((br: any) => br.tools?.owner_id)
            .map((br: any) => br.tools?.owner_id)
        ));

        if (ownerIds.length > 0) {
          const { data: owners } = await supabase
            .from('users_ext')
            .select('user_id, email, phone_number')
            .in('user_id', ownerIds as string[]);

          if (owners) {
            const ownerMap = new Map(owners.map((o: any) => [o.user_id, o]));
            borrowDataWithOwners = borrowDataWithOwners.map((br: any) => ({
              ...br,
              tools: br.tools ? {
                ...br.tools,
                owner: ownerMap.get(br.tools.owner_id) || null
              } : null
            }));
          }
        }
      }

      if (borrowDataWithOwners) {
        console.log('Borrow requests fetched:', borrowDataWithOwners);
        // Filter out returned requests from active display
        setBorrowRequests((borrowDataWithOwners as unknown as BorrowRequest[]) || []);
      } else if (borrowError) {
        console.error('Error fetching borrow requests:', borrowError);
        setBorrowRequests([]);
      }

      // Fetch owner's tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .eq('owner_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (!toolsError) {
        console.log('Tools fetched:', toolsData);
        setTools(toolsData || []);

        // Fetch borrow requests for owner's tools
        if (toolsData && toolsData.length > 0) {
          const toolIds = toolsData.map((t: any) => t.id);
          
          const { data: ownerRequestsData, error: ownerRequestsError } = await supabase
            .from('borrow_requests')
            .select('*')
            .in('tool_id', toolIds)
            .order('created_at', { ascending: false });

          if (!ownerRequestsError && ownerRequestsData) {
            // Get unique user IDs from requests
            const userIds = [...new Set(ownerRequestsData.map((r: any) => r.user_id))];
            
            // Fetch user emails and phone numbers
            const { data: usersData } = await supabase
              .from('users_ext')
              .select('user_id, email, phone_number')
              .in('user_id', userIds);
            
            const usersMap = new Map(usersData?.map(u => [u.user_id, { email: u.email, phone_number: u.phone_number }]) || []);
            const toolsMap = new Map(toolsData.map(t => [t.id, t.name]));
            
            const transformedRequests: BorrowRequest[] = ownerRequestsData.map(req => ({
              id: req.id,
              tool_id: req.tool_id,
              start_date: req.start_date,
              end_date: req.end_date,
              status: req.status,
              tools: { 
                name: toolsMap.get(req.tool_id) || 'Unknown Tool',
                owner: usersMap.get(req.user_id) || { email: 'Unknown', phone_number: null }
              },
              users: { 
                email: usersMap.get(req.user_id)?.email || 'Unknown User',
                phone_number: usersMap.get(req.user_id)?.phone_number 
              },
            }));
            
            console.log('Owner requests fetched:', transformedRequests);
            setOwnerRequests(transformedRequests);
          }
        }
      } else {
        console.error('Error fetching tools:', toolsError);
      }

      // Call subscription check endpoint to ensure tier is correct based on tool count
      try {
        const response = await fetch('/api/subscriptions/check-tool-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session?.user?.id }),
        });
        const result = await response.json();
        console.log('Subscription check result:', result);
        // Note: subscription check updates the database, no need to recalculate here
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) throw error;
      showToast('Request approved successfully!', 'success');
      fetchData();
    } catch (err) {
      console.error('Error approving request:', err);
      showToast('Failed to approve request', 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      showToast('Request rejected', 'success');
      fetchData();
    } catch (err) {
      console.error('Error rejecting request:', err);
      showToast('Failed to reject request', 'error');
    }
  };

  const handleReturn = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({ status: 'returned' })
        .eq('id', requestId);

      if (error) throw error;
      showToast('Tool marked as returned!', 'success');
      fetchData();
    } catch (err) {
      console.error('Error returning tool:', err);
      showToast('Failed to return tool', 'error');
    }
  };

  const handleManualSync = async () => {
    setSyncingTier(true);
    setSyncMessage('');
    try {
      const response = await fetch('/api/sync-subscription', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.synced) {
        setSyncMessage(`✓ Synced! Updated to ${data.tier} tier`);
        showToast(`Subscription updated to ${data.tier} tier!`, 'success');
        // Refresh data after sync
        setTimeout(() => {
          fetchData();
        }, 1000);
      } else {
        setSyncMessage(`✗ Sync failed: ${data.error || 'Unknown error'}`);
        showToast('Sync failed', 'error');
      }
    } catch (err) {
      setSyncMessage('✗ Failed to sync subscription');
      showToast('Failed to sync subscription', 'error');
      console.error('Sync error:', err);
    } finally {
      setSyncingTier(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId)
        .eq('owner_id', session?.user?.id);

      if (error) throw error;

      // Call subscription check endpoint to handle potential downgrade
      await fetch('/api/subscriptions/check-tool-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user?.id }),
      });

      showToast('Tool deleted successfully', 'success');
      fetchData();
    } catch (err) {
      console.error('Error deleting tool:', err);
      showToast('Failed to delete tool', 'error');
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

  const activeRequests = borrowRequests.filter((r) => r.status === 'approved');
  const pendingRequests = borrowRequests.filter((r) => r.status === 'pending');
  const rejectedRequests = borrowRequests.filter((r) => r.status === 'rejected');
  const ownerPendingRequests = ownerRequests.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Unlock Celebration Modal */}
      {showUnlockCelebration && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-10 text-center animate-pulse-once">
            <div className="text-7xl mb-5">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {showUnlockCelebration === 'basic' ? 'Basic Tier Unlocked!' : 'Standard Tier Unlocked!'}
            </h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              {showUnlockCelebration === 'basic' ? (
                <>Thank you for contributing your tool to the community. You've unlocked <strong className="text-blue-600">Basic tier access—free, forever</strong>, as long as your tool stays listed.</>
              ) : (
                <>Amazing! By listing 3 tools, you've unlocked <strong className="text-purple-600">Standard tier access—free, forever</strong>, as long as your tools stay listed. Your contribution makes ToolTree work.</>
              )}
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 mb-6 text-left">
              <p className="font-bold text-gray-900 mb-3 text-center text-lg">Your New Limits</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-gray-600 text-xs mb-1">Active Borrows</p>
                  <p className="text-2xl font-bold text-gray-900">{showUnlockCelebration === 'basic' ? '1' : '2'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-gray-600 text-xs mb-1">Coverage Limit</p>
                  <p className="text-2xl font-bold text-gray-900">£{showUnlockCelebration === 'basic' ? '100' : '300'}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-gray-600 text-xs mb-1">Max Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{showUnlockCelebration === 'basic' ? '3' : '7'} days</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-gray-600 text-xs mb-1">Protection</p>
                  <p className="text-lg font-bold text-green-600">🛡️ Active</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>🛡️ Your Tools Are Protected:</strong> While others borrow your tools, ToolTree's damage coverage protects you up to each tool's listed value.
              </p>
            </div>
            
            <button
              onClick={() => setShowUnlockCelebration(null)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
            >
              Start Browsing Tools →
            </button>
          </div>
        </div>
      )}

      {/* Hero Header - Simplified */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            {toolsCount > 0 && (
              <ToolOwnerBadge 
                toolsCount={toolsCount}
                subscriptionTier={subscriptionTier}
                size="md"
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Tier Status - Visually Dominant */}
        <div>
          <TierSummary
            effectiveTier={effectiveTier as 'basic' | 'standard' | 'pro'}
            toolsCount={toolsCount}
            isPaidTier={isPaidTier}
            showNextUnlock={true}
            compact={false}
          />
          
          {/* Manual Sync Button */}
          <div className="mt-4 flex gap-4 items-center">
            <button
              onClick={handleManualSync}
              disabled={syncingTier}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition"
            >
              {syncingTier ? 'Syncing...' : '🔄 Sync Subscription'}
            </button>
            {syncMessage && (
              <p className={`text-sm font-semibold ${syncMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {syncMessage}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats - Simplified */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-5 border border-gray-200 text-center">
            <p className="text-3xl font-bold text-blue-600">{activeRequests.length}</p>
            <p className="text-sm text-gray-600 mt-1">Active Borrows</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200 text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length + ownerPendingRequests.length}</p>
            <p className="text-sm text-gray-600 mt-1">Pending</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200 text-center">
            <p className="text-3xl font-bold text-purple-600">{tools.length}</p>
            <p className="text-sm text-gray-600 mt-1">Your Tools</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200 text-center">
            <p className="text-2xl font-bold text-gray-900 capitalize">{effectiveTier}</p>
            <p className="text-sm text-gray-600 mt-1">Current Tier</p>
          </div>
        </div>

        {/* Active Borrows */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Active Borrows</h2>
            <Link href="/tools" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              Browse Tools →
            </Link>
          </div>
          {loadingData ? (
            <p className="text-gray-600">Loading requests...</p>
          ) : activeRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.tools?.name}</h3>
                        <div className="flex gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">START DATE</p>
                            <p className="font-semibold text-gray-900">{request.start_date}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">END DATE</p>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{request.end_date}</p>
                              {new Date(request.end_date) < new Date() && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-semibold">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {new Date(request.end_date) < new Date() ? (
                        <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold">
                          ⚠ Overdue
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                          ✓ Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
                      <p className="text-xs text-gray-600 mb-2">TOOL OWNER CONTACT</p>
                      {request.tools?.owner?.phone_number && (
                        <a 
                          href={`tel:${request.tools.owner.phone_number}`}
                          className="text-sm text-blue-700 font-semibold hover:underline flex items-center gap-2 mb-2"
                        >
                          📞 {request.tools.owner.phone_number}
                        </a>
                      )}
                      {request.tools?.owner?.email && (
                        <a 
                          href={`mailto:${request.tools.owner.email}`}
                          className="text-sm text-blue-700 font-semibold hover:underline flex items-center gap-2"
                        >
                          ✉️ {request.tools.owner.email}
                        </a>
                      )}
                      {!request.tools?.owner?.phone_number && !request.tools?.owner?.email && (
                        <p className="text-sm text-gray-600">Contact information not available</p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleReturn(request.id)}
                      className="w-full bg-gradient-to-r from-red-50 to-red-100 text-red-600 py-2.5 rounded-lg hover:from-red-100 hover:to-red-200 font-semibold transition">
                      Return Tool
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-600 mb-4 font-medium">No active borrows yet</p>
              <Link href="/tools" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition">
                Start Browsing Tools
              </Link>
            </div>
          )}
        </section>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.tools?.name}</h3>
                        <div className="flex gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs mb-1">START DATE</p>
                            <p className="font-semibold text-gray-900">{request.start_date}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-1">END DATE</p>
                            <p className="font-semibold text-gray-900">{request.end_date}</p>
                          </div>
                        </div>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">
                        ⏳ Pending
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <button className="w-full bg-gradient-to-r from-red-50 to-red-100 text-red-600 py-2.5 rounded-lg hover:from-red-100 hover:to-red-200 font-semibold transition">
                      Cancel Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {(rejectedRequests.length > 0 || borrowRequests.filter(r => r.status === 'returned').length > 0) && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rejectedRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.tools?.name}</h3>
                    </div>
                    <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold">
                      ✗ Rejected
                    </span>
                  </div>
                </div>
              ))}
              {borrowRequests.filter(r => r.status === 'returned').map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.tools?.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">Returned on {request.end_date}</p>
                    </div>
                    <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-semibold">
                      ✓ Returned
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Owner: Borrow Requests for Your Tools */}
        {ownerPendingRequests.length > 0 && (
          <section className="border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Borrow Requests for Your Tools</h2>
            <div className="space-y-4">
              {ownerPendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.tools?.name}</h3>
                      <p className="text-gray-600 text-sm">Requested by: {request.users?.email}</p>
                      {request.users?.phone_number && (
                        <p className="text-blue-600 text-sm font-semibold mt-1">
                          📞 {request.users.phone_number}
                        </p>
                      )}
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">
                      ⏳ Pending
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Start Date</p>
                      <p className="font-semibold text-gray-900">{request.start_date}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Date</p>
                      <p className="font-semibold text-gray-900">{request.end_date}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Owner: Active Borrows on Your Tools */}
        {ownerRequests.filter(r => r.status === 'approved').length > 0 && (
          <section className="border-t pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tools Currently Being Borrowed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ownerRequests.filter(r => r.status === 'approved').map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.tools?.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">Borrowed by: {request.users?.email}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                        ✓ Active
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Borrowed From</p>
                        <p className="font-semibold text-gray-900">{request.start_date}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Due Back</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{request.end_date}</p>
                          {new Date(request.end_date) < new Date() && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-semibold">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <p className="text-xs text-gray-600 mb-1">BORROWER CONTACT</p>
                      {request.users?.phone_number ? (
                        <a 
                          href={`tel:${request.users.phone_number}`}
                          className="text-sm text-blue-700 font-semibold hover:underline inline-block"
                        >
                          📞 {request.users.phone_number}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600">Phone number not available</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Contact them to arrange collection and return</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Owner: Your Tools Section */}
        {tools.length > 0 && (
          <section className="border-t pt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Tools</h2>
              <Link
                href="/tools/add"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add Tool
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <div key={tool.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{tool.category}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        tool.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {tool.available ? 'Available' : 'Unavailable'}
                    </span>
                    <span className="font-semibold text-blue-600">£{tool.tool_value}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/tools/${tool.id}`}
                      className="flex-1 text-center bg-blue-100 text-blue-900 py-2 rounded hover:bg-blue-200 text-sm font-semibold transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/tools/${tool.id}/edit`}
                      className="flex-1 text-center bg-blue-100 text-blue-900 py-2 rounded hover:bg-blue-200 text-sm font-semibold transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteTool(tool.id)}
                      className="flex-1 text-center bg-red-100 text-red-900 py-2 rounded hover:bg-red-200 text-sm font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
