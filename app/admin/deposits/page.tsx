'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Deposit {
  id: string;
  tool_id: string;
  renter_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  rental_cost: number;
  deposit_amount: number;
  deposit_status: string;
  deposit_claim_reason?: string;
  deposit_admin_notes?: string;
  return_confirmed_at?: string;
  claim_window_ends_at?: string;
  deposit_claimed_at?: string;
  deposit_released_at?: string;
  status: string;
  created_at: string;
  stripe_payment_intent_id?: string;
  tools?: {
    id: string;
    name: string;
  };
  renter?: {
    id: string;
    email: string;
    username?: string;
  };
  owner?: {
    id: string;
    email: string;
    username?: string;
  };
}

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export default function AdminDepositsPage() {
  const { data: session, status } = useSession();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'claimed' | 'held' | 'pending_release' | 'released' | 'forfeited' | 'refunded'>('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [holdNotes, setHoldNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchDeposits();
    }
  }, [status, isAdmin]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/deposits');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setDeposits(data.deposits || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (rentalId: string, action: 'refund' | 'forfeit') => {
    if (!confirm(`Are you sure you want to ${action === 'refund' ? 'REFUND the deposit to the renter' : 'FORFEIT the deposit (owner keeps it)'}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/deposits/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          action,
          adminNotes: adminNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve deposit');
      }

      alert(`Deposit ${action === 'refund' ? 'refunded' : 'forfeited'} successfully`);
      setResolvingId(null);
      setAdminNotes('');
      fetchDeposits();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error resolving deposit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async (rentalId: string) => {
    if (!confirm('Are you sure you want to manually HOLD this deposit and prevent automatic release?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/deposits/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          adminNotes: holdNotes || 'Manually held by admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to hold deposit');
      }

      alert('Deposit held successfully');
      setHoldingId(null);
      setHoldNotes('');
      fetchDeposits();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error holding deposit');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDeposits = filter === 'all'
    ? deposits
    : deposits.filter(d => d.deposit_status === filter);

  const statusCounts = deposits.reduce((acc, d) => {
    acc[d.deposit_status] = (acc[d.deposit_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      held: 'bg-blue-100 text-blue-800',
      pending_release: 'bg-yellow-100 text-yellow-800',
      released: 'bg-green-100 text-green-800',
      claimed: 'bg-red-100 text-red-800',
      forfeited: 'bg-red-200 text-red-900',
      refunded: 'bg-green-200 text-green-900',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to view this page.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deposit Management</h1>
            <p className="text-gray-600 mt-1">Review and resolve deposit claims</p>
          </div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Admin
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Deposits</p>
            <p className="text-2xl font-bold text-gray-900">{deposits.length}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-semibold">Needs Review</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts['claimed'] || 0}</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600">Currently Held</p>
            <p className="text-2xl font-bold text-blue-600">{(statusCounts['held'] || 0) + (statusCounts['pending_release'] || 0)}</p>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600">Released/Refunded</p>
            <p className="text-2xl font-bold text-green-600">{(statusCounts['released'] || 0) + (statusCounts['refunded'] || 0)}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'claimed', 'held', 'pending_release', 'released', 'forfeited', 'refunded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {f !== 'all' && statusCounts[f] ? ` (${statusCounts[f]})` : ''}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading deposits...</p>
          </div>
        ) : filteredDeposits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No deposits found{filter !== 'all' ? ` with status "${filter}"` : ''}</p>
          </div>
        ) : (
          /* Deposit Cards */
          <div className="space-y-4">
            {filteredDeposits.map((deposit) => (
              <div key={deposit.id} className={`bg-white border rounded-lg p-6 ${deposit.deposit_status === 'claimed' ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'}`}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {deposit.tools?.name || 'Unknown Tool'}
                      </h3>
                      {getStatusBadge(deposit.deposit_status)}
                      {deposit.deposit_status === 'claimed' && (
                        <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold animate-pulse">
                          ACTION REQUIRED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><strong>Rental ID:</strong> {deposit.id.slice(0, 8)}...</div>
                      <div><strong>Deposit:</strong> £{(deposit.deposit_amount || 10).toFixed(2)}</div>
                      <div><strong>Renter:</strong> {deposit.renter?.username || deposit.renter?.email || 'Unknown'}</div>
                      <div><strong>Owner:</strong> {deposit.owner?.username || deposit.owner?.email || 'Unknown'}</div>
                      <div><strong>Rental Period:</strong> {formatDate(deposit.start_date)} → {formatDate(deposit.end_date)}</div>
                      <div><strong>Rental Cost:</strong> £{deposit.rental_cost?.toFixed(2)}</div>
                      {deposit.return_confirmed_at && (
                        <div><strong>Returned:</strong> {formatDate(deposit.return_confirmed_at)}</div>
                      )}
                      {deposit.claim_window_ends_at && (
                        <div><strong>Claim Window Ends:</strong> {formatDate(deposit.claim_window_ends_at)}</div>
                      )}
                    </div>

                    {/* Claim Reason */}
                    {deposit.deposit_claim_reason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm font-semibold text-red-800 mb-1">Owner&apos;s Damage Report:</p>
                        <p className="text-sm text-red-700">{deposit.deposit_claim_reason}</p>
                        {deposit.deposit_claimed_at && (
                          <p className="text-xs text-red-500 mt-1">Claimed: {formatDate(deposit.deposit_claimed_at)}</p>
                        )}
                      </div>
                    )}

                    {/* Admin Notes */}
                    {deposit.deposit_admin_notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm font-semibold text-blue-800 mb-1">Admin Notes:</p>
                        <p className="text-sm text-blue-700">{deposit.deposit_admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  {deposit.deposit_status === 'claimed' && (
                    <div className="flex-shrink-0 lg:w-72">
                      {resolvingId === deposit.id ? (
                        <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <textarea
                            placeholder="Admin notes (optional)..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolve(deposit.id, 'refund')}
                              disabled={actionLoading}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoading ? '...' : 'Refund'}
                            </button>
                            <button
                              onClick={() => handleResolve(deposit.id, 'forfeit')}
                              disabled={actionLoading}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading ? '...' : 'Forfeit'}
                            </button>
                          </div>
                          <button
                            onClick={() => { setResolvingId(null); setAdminNotes(''); }}
                            className="w-full text-gray-500 text-sm hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(deposit.id)}
                          className="w-full bg-amber-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-amber-600 transition"
                        >
                          Review & Resolve
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions for Pending Release deposits */}
                  {deposit.deposit_status === 'pending_release' && (
                    <div className="flex-shrink-0 lg:w-72">
                      {holdingId === deposit.id ? (
                        <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <textarea
                            placeholder="Why are you holding this deposit? (optional)..."
                            value={holdNotes}
                            onChange={(e) => setHoldNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                            rows={3}
                          />
                          <button
                            onClick={() => handleHold(deposit.id)}
                            disabled={actionLoading}
                            className="w-full bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
                          >
                            {actionLoading ? '...' : 'Confirm Hold'}
                          </button>
                          <button
                            onClick={() => { setHoldingId(null); setHoldNotes(''); }}
                            className="w-full text-gray-500 text-sm hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => setHoldingId(deposit.id)}
                            className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                          >
                            🔒 Hold Release
                          </button>
                          <button
                            disabled
                            className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold border border-green-200 cursor-not-allowed"
                          >
                            ✓ Auto-releases in window
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
