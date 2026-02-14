'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Rental {
  id: string;
  tool_id: string;
  renter_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  rental_cost: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
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

interface ToolRequest {
  id: string;
  user_id: string;
  tool_name: string;
  category: string;
  postcode: string;
  description?: string;
  upvote_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'completed'>('all');
  const [toolRequests, setToolRequests] = useState<ToolRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [requestFilter, setRequestFilter] = useState<'all' | 'open' | 'fulfilled' | 'closed'>('all');

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchRentals();
      fetchToolRequests();
    }
  }, [status, isAdmin]);

  const fetchToolRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await fetch('/api/tool-requests?all=true');
      const data = await response.json();
      if (response.ok) {
        setToolRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching tool requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: string) => {
    setUpdatingRequestId(requestId);
    try {
      const response = await fetch('/api/tool-requests/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: newStatus }),
      });
      if (response.ok) {
        await fetchToolRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to update request status');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/rentals');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      setRentals(data.rentals || []);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Fetch error:', message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (rentalId: string) => {
    if (!confirm('Are you sure you want to decline this rental request? The renter will be refunded.')) {
      return;
    }

    setDecliningId(rentalId);
    try {
      const response = await fetch('/api/admin/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId, reason: 'Declined by administrator' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to decline rental');
      }

      // Refresh rentals list
      await fetchRentals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline rental');
    } finally {
      setDecliningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getHoursSinceCreation = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours;
  };

  // Filter rentals based on selected filter
  const filteredRentals = rentals.filter(rental => {
    if (filter === 'all') return true;
    if (filter === 'pending') return rental.status === 'pending_approval';
    if (filter === 'active') return rental.status === 'active';
    if (filter === 'rejected') return rental.status === 'rejected';
    if (filter === 'completed') return rental.status === 'completed' || rental.status === 'returned';
    return true;
  });

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access the admin dashboard.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage all rental requests and transactions</p>
          </div>
          <Link
            href="/admin/deposits"
            className="bg-amber-500 text-white px-5 py-3 rounded-lg font-semibold hover:bg-amber-600 transition"
          >
            🛡️ Manage Deposits
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">
              {rentals.filter(r => r.status === 'pending_approval').length}
            </div>
            <div className="text-sm text-gray-500">Pending Approval</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {rentals.filter(r => r.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">
              {rentals.filter(r => r.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {rentals.filter(r => r.status === 'completed' || r.status === 'returned').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['all', 'pending', 'active', 'rejected', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    filter === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'pending' && (
                    <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                      {rentals.filter(r => r.status === 'pending_approval').length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={fetchRentals} className="ml-4 text-red-900 underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500">Loading rentals...</div>
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500">No rentals found</div>
          </div>
        ) : (
          /* Rentals Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRentals.map((rental) => {
                  const hoursSinceCreation = getHoursSinceCreation(rental.created_at);
                  const isOverdue = rental.status === 'pending_approval' && hoursSinceCreation >= 48;

                  return (
                    <tr key={rental.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rental.tools?.name || 'Unknown Tool'}
                        </div>
                        <div className="text-xs text-gray-500">ID: {rental.tool_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rental.renter?.username || rental.renter?.email || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{rental.renter?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{rental.owner?.username || rental.owner?.email || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{rental.owner?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          £{(rental.rental_cost || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(rental.status)}`}>
                          {rental.status.replace('_', ' ')}
                        </span>
                        {rental.rejection_reason && (
                          <div className="text-xs text-gray-500 mt-1">{rental.rejection_reason}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {hoursSinceCreation}h ago
                          {isOverdue && <span className="block text-xs">OVERDUE</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rental.status === 'pending_approval' && (
                          <button
                            onClick={() => handleDecline(rental.id)}
                            disabled={decliningId === rental.id}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {decliningId === rental.id ? 'Declining...' : 'Decline'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchRentals}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>

        {/* Tool Requests Section */}
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                📢 Tool Requests
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {toolRequests.filter(r => r.status === 'open').length} open
                </span>
              </h2>
              <p className="text-gray-600 mt-1">User-submitted tool requests. Mark as fulfilled when the tool gets listed.</p>
            </div>
            <button
              onClick={fetchToolRequests}
              disabled={requestsLoading}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
            >
              Refresh Requests
            </button>
          </div>

          {/* Request Filter Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {(['all', 'open', 'fulfilled', 'closed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRequestFilter(tab)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      requestFilter === tab
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'open' && (
                      <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                        {toolRequests.filter(r => r.status === 'open').length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Requests Table */}
          {requestsLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">Loading requests...</div>
            </div>
          ) : toolRequests.filter(r => requestFilter === 'all' || r.status === requestFilter).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500">No tool requests found</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upvotes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {toolRequests
                    .filter(r => requestFilter === 'all' || r.status === requestFilter)
                    .map((req) => (
                    <tr key={req.id} className={req.status === 'fulfilled' ? 'bg-green-50' : req.status === 'closed' ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{req.tool_name}</div>
                        {req.description && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">{req.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">{req.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">📍 {req.postcode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-orange-600">👍 {req.upvote_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          req.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {req.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, 'fulfilled')}
                                disabled={updatingRequestId === req.id}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                {updatingRequestId === req.id ? '...' : '✓ Fulfilled'}
                              </button>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, 'closed')}
                                disabled={updatingRequestId === req.id}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 disabled:opacity-50"
                              >
                                Close
                              </button>
                            </>
                          )}
                          {req.status === 'fulfilled' && (
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'open')}
                              disabled={updatingRequestId === req.id}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                            >
                              Reopen
                            </button>
                          )}
                          {req.status === 'closed' && (
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, 'open')}
                              disabled={updatingRequestId === req.id}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
