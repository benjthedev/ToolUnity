'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';

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
}

interface ToolRequestListProps {
  requests: ToolRequest[];
  userUpvotes: string[];
  onUpvote: (requestId: string) => void;
}

export default function ToolRequestList({ requests, userUpvotes, onUpvote }: ToolRequestListProps) {
  const { session } = useAuth();
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

  const handleUpvote = async (requestId: string) => {
    if (!session?.user) {
      alert('Please sign in to upvote requests');
      return;
    }

    setUpvotingId(requestId);
    try {
      const response = await fetch('/api/tool-requests/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upvote');
      }

      onUpvote(requestId);
    } catch (err) {
      console.error('Upvote error:', err);
    } finally {
      setUpvotingId(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">🔍</span>
        <h2 className="text-xl font-bold text-gray-900">Requested Tools</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {requests.length} {requests.length === 1 ? 'request' : 'requests'}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        People in your area are looking for these tools. Got one to share? <a href="/dashboard" className="text-blue-600 hover:underline font-medium">List it now!</a>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((req) => {
          const hasUpvoted = userUpvotes.includes(req.id);
          const isUpvoting = upvotingId === req.id;

          return (
            <div
              key={req.id}
              className="bg-white border-2 border-dashed border-orange-200 rounded-xl p-5 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{req.tool_name}</h3>
                  <span className="inline-block text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full mt-1">
                    {req.category}
                  </span>
                </div>
                <button
                  onClick={() => handleUpvote(req.id)}
                  disabled={isUpvoting}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all ${
                    hasUpvoted
                      ? 'bg-orange-100 text-orange-600 border border-orange-300'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200'
                  } ${isUpvoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={hasUpvoted ? 'Remove upvote' : 'Upvote this request'}
                >
                  <span className="text-lg">{hasUpvoted ? '🔥' : '👍'}</span>
                  <span className="text-xs font-bold">{req.upvote_count}</span>
                </button>
              </div>

              {req.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{req.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  📍 {req.postcode}
                </span>
                <span>{getTimeAgo(req.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
