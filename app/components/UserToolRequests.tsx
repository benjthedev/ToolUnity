'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';

interface ToolRequest {
  id: string;
  user_id: string;
  tool_name: string;
  category: string;
  postcode: string;
  description: string;
  upvote_count: number;
  status: string;
  created_at: string;
}

const CATEGORIES = [
  'Hand Tools',
  'Power Tools',
  'Cleaning',
  'Safety',
  'Other',
];

export default function UserToolRequests() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ToolRequest>>({});

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserRequests();
    }
  }, [session?.user?.id]);

  const fetchUserRequests = async () => {
    try {
      console.log('[UserToolRequests] Fetching requests for user:', session?.user?.id);
      const response = await fetch('/api/tool-requests?all=true');
      if (response.ok) {
        const data = await response.json();
        console.log('[UserToolRequests] All requests received:', data.requests.length);
        console.log('[UserToolRequests] Raw requests data:', data.requests);
        console.log('[UserToolRequests] Current session user_id:', session?.user?.id);
        // Filter to only show requests created by the current user
        const userRequests = data.requests.filter(
          (req: ToolRequest) => req.user_id === session?.user?.id
        );
        console.log('[UserToolRequests] Filtered to user requests:', userRequests.length);
        console.log('[UserToolRequests] Filtered requests:', userRequests);
        setRequests(userRequests);
      } else {
        console.error('[UserToolRequests] Fetch failed with status:', response.status);
      }
    } catch (error) {
      console.error('[UserToolRequests] Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: ToolRequest) => {
    console.log('[UserToolRequests] handleEdit called with request:', { id: request.id, tool_name: request.tool_name });
    setEditingId(request.id);
    setEditFormData({
      tool_name: request.tool_name,
      category: request.category,
      postcode: request.postcode,
      description: request.description,
    });
    console.log('[UserToolRequests] State updated - editingId set to:', request.id);
  };

  const handleSaveEdit = async () => {
    console.log('[UserToolRequests] handleSaveEdit called, editingId:', editingId);
    if (!editingId) {
      console.error('[UserToolRequests] No editingId, returning');
      return;
    }

    try {
      console.log('[UserToolRequests] Saving edit for request:', editingId);
      const response = await fetch(`/api/tool-requests/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include session cookie
        body: JSON.stringify({
          tool_name: editFormData.tool_name,
          category: editFormData.category,
          postcode: editFormData.postcode,
          description: editFormData.description,
        }),
      });

      console.log('[UserToolRequests] Save response status:', response.status);

      if (response.ok) {
        console.log('[UserToolRequests] Save successful, refreshing requests');
        setEditingId(null);
        setEditFormData({});
        fetchUserRequests();
      } else {
        const errorData = await response.json();
        console.error('[UserToolRequests] Save failed:', errorData);
        alert(`Error saving request: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[UserToolRequests] Error updating request:', error);
      alert('Error saving request: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      console.log('[UserToolRequests] Deleting request:', requestId);
      const response = await fetch(`/api/tool-requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include', // Include session cookie
      });

      console.log('[UserToolRequests] Delete response status:', response.status);

      if (response.ok) {
        console.log('[UserToolRequests] Delete successful');
        setRequests(requests.filter(r => r.id !== requestId));
      } else {
        const errorData = await response.json();
        console.error('[UserToolRequests] Delete failed:', errorData);
        alert(`Error deleting request: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[UserToolRequests] Error deleting request:', error);
      alert('Error deleting request: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading your requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
        <p className="text-gray-700">You haven't made any tool requests yet.</p>
        <p className="text-sm text-gray-600 mt-2">Browse tools you need and request them to connect with owners in your area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6">
          {editingId === request.id ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tool Name</label>
                <input
                  type="text"
                  value={editFormData.tool_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, tool_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={editFormData.category || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Postcode</label>
                <input
                  type="text"
                  value={editFormData.postcode || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, postcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{request.tool_name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                      {request.category}
                    </span>
                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold ${
                      request.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'fulfilled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status === 'fulfilled' ? '✓ Fulfilled' : 'Open'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">🔥 {request.upvote_count}</p>
                  <p className="text-xs text-gray-500">upvotes</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">{request.postcode}</p>
                </div>
                <div>
                  <p className="text-gray-600">Requested</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(request.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>

              {request.description && (
                <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
                  <p className="text-gray-700">{request.description}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(request)}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 font-semibold text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(request.id)}
                  className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-semibold text-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
