'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/app/utils/toast';

interface Tool {
  id: string;
  name: string;
  category: string;
  available: boolean;
  tool_value: number;
}

interface BorrowRequest {
  id: string;
  tool_id: string;
  start_date: string;
  end_date: string;
  notes?: string | null;
  status: string;
  tools?: { name: string } | null;
  users?: { email: string; phone_number?: string | null } | null;
}

export default function OwnerDashboard() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [loadingData, setLoadingData] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);

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

      // Fetch owner's tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .eq('owner_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (toolsError) {
        console.warn('Tools fetch failed, using demo data:', toolsError);
        // Demo tools
        const demoTools: Tool[] = [
          {
            id: '1',
            name: 'Power Drill - DeWalt 20V',
            category: 'Power Tools',
            available: true,
            tool_value: 10,
          },
          {
            id: '3',
            name: 'Complete Hand Tool Set',
            category: 'Hand Tools',
            available: true,
            tool_value: 5,
          },
        ];
        setTools(demoTools);
        
        // Demo requests
        const demoRequests: BorrowRequest[] = [
          {
            id: 'demo-req-1',
            tool_id: '1',
            start_date: '2024-01-22',
            end_date: '2024-01-25',
            status: 'pending',
            tools: { name: 'Power Drill - DeWalt 20V' },
            users: { email: 'customer@example.com' },
          },
        ];
        setRequests(demoRequests);
        throw toolsError;
      }
      console.log('Owner ID:', session?.user?.id);
      console.log('Owner tools fetched:', toolsData);
      console.log('Tool IDs:', toolsData?.map(t => ({ id: t.id, name: t.name })));
      setTools(toolsData || []);

      // Fetch borrow requests for owner's tools
      if (toolsData && toolsData.length > 0) {
        const toolIds = toolsData.map((t) => t.id);
        console.log('Looking for requests with tool_id in:', toolIds);
        
        // First check: get ALL borrow requests to see what exists
        const { data: allReqs } = await supabase
          .from('borrow_requests')
          .select('id, tool_id, user_id, status');
        
        console.log('All borrow requests in database:', allReqs);
        
        // Now do the filtered query
        const { data: requestsData, error: requestsError } = await supabase
          .from('borrow_requests')
          .select('*,tools:tool_id(name),users:user_id(email,phone_number)')
          .in('tool_id', toolIds)
          .order('created_at', { ascending: false });

        if (requestsError) {
          console.warn('Requests fetch failed:', requestsError);
          setRequests([]);
        } else {
          console.log('Filtered requests (matching owner tools):', requestsData);
          
          // Transform the data to match BorrowRequest interface
          if (requestsData && requestsData.length > 0) {
            // Get the tool names from toolsData
            const toolsMap = new Map(toolsData.map(t => [t.id, t.name]));
            
            // Get unique user IDs from requests
            const userIds = [...new Set(requestsData.map(r => r.user_id))];
            
            // Fetch user emails
            const { data: usersData } = await supabase
              .from('users_ext')
              .select('user_id, email')
              .in('user_id', userIds);
            
            const usersMap = new Map(usersData?.map(u => [u.user_id, u.email]) || []);
            
            const transformedRequests: BorrowRequest[] = requestsData.map(req => ({
              id: req.id,
              tool_id: req.tool_id,
              start_date: req.start_date,
              end_date: req.end_date,
              notes: req.notes,
              status: req.status,
              tools: { name: toolsMap.get(req.tool_id) || 'Unknown Tool' },
              users: { email: usersMap.get(req.user_id) || 'Unknown User' },
            }));
            
            console.log('Transformed requests:', transformedRequests);
            setRequests(transformedRequests);
          } else {
            console.log('No requests found for these tool IDs');
            setRequests([]);
          }
        }
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
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
      fetchData();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('borrow_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request');
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
      
      // Remove from local state
      setTools(tools.filter(t => t.id !== toolId));
      
      // Recalculate tier after tool deletion
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/subscriptions/check-tool-count', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session.user.id }),
          });
          const result = await response.json();
          if (result.action === 'downgraded_no_tools') {
            showToast('You no longer qualify for your previous tier', 'info');
          }
        } catch (tierErr) {
          console.warn('Failed to recalculate tier after tool deletion:', tierErr);
        }
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your tool listings and borrow requests</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Owner Protection Summary */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your Owner Protection</h2>
              <p className="text-gray-700 mb-4">
                Tools covered up to <strong>£100–£1,000</strong> (depending on your subscription). Damage claims paid within 48 hours.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                All tools are protected by our damage liability guarantee. Upload clear baseline condition photos when listing to ensure fair damage assessment.
              </p>
              <Link
                href="/owner-protection"
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                Learn more about owner protection →
              </Link>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600 mb-1">Free Tier</div>
              <div className="text-sm text-gray-600">£100 coverage</div>
            </div>
          </div>
        </section>

        {/* Your Tools Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Tools</h2>
            <Link
              href="/tools/add"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Tool
            </Link>
          </div>

          {loadingData ? (
            <p className="text-gray-600">Loading tools...</p>
          ) : tools.length > 0 ? (
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
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 mb-4">You haven't listed any tools yet</p>
              <Link
                href="/tools/add"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                List your first tool
              </Link>
            </div>
          )}
        </section>

        {/* Borrow Requests Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Borrow Requests</h2>

          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.tools?.name}</h3>
                      <p className="text-gray-600 text-sm">Requested by: {request.users?.email}</p>
                      {request.status === 'approved' && request.users?.phone_number && (
                        <p className="text-blue-600 text-sm font-semibold mt-1">
                          <a href={`tel:${request.users.phone_number}`} className="hover:underline">
                            📞 {request.users.phone_number}
                          </a>
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  {request.notes && (
                    <div className="bg-gray-50 rounded p-4 mb-4">
                      <p className="text-gray-700 text-sm">{request.notes}</p>
                    </div>
                  )}

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

                  {request.status === 'pending' && (
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
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600">No borrow requests yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
