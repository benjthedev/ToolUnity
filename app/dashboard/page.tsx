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
  daily_rental_rate?: number;
  tools?: { 
    name: string;
    owner: {
      email: string;
      phone_number: string | null;
    } | null;
  } | null;
}

interface Tool {
  id: string;
  name: string;
  category: string;
  available: boolean;
  daily_rental_rate: number;
  owner_id: string;
}

export default function DashboardPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [activeRentals, setActiveRentals] = useState<Rental[]>([]);
  const [pendingRentals, setPendingRentals] = useState<Rental[]>([]);
  const [ownerRentals, setOwnerRentals] = useState<Rental[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

      // Fetch user's rentals (tools they rented)
      const { data: rentalData } = await supabase
        .from('rental_transactions')
        .select('*, tools(name, owner_id, users_ext(email, phone_number))')
        .eq('renter_id', session.user.id)
        .order('start_date', { ascending: false });

      if (rentalData) {
        setActiveRentals(rentalData.filter((r: Rental) => r.status === 'active') || []);
        setPendingRentals(rentalData.filter((r: Rental) => r.status === 'pending_payment') || []);
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
            .select('*, tools(name)')
            .in('tool_id', toolIds)
            .in('status', ['active', 'pending_payment'])
            .order('start_date', { ascending: false });

          if (ownerRentalsData) {
            setOwnerRentals(ownerRentalsData || []);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleReturn = async (rentalId: string) => {
    try {
      const { error } = await supabase
        .from('rental_transactions')
        .update({ status: 'returned', end_date: new Date().toISOString().split('T')[0] })
        .eq('id', rentalId);

      if (error) throw error;

      showToast('Tool returned successfully', 'success');
      fetchData();
    } catch (err) {
      console.error('Error returning tool:', err);
      showToast('Failed to return tool', 'error');
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId);

      if (error) throw error;

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

  const totalEarningsPotential = tools.length > 0 
    ? ownerRentals.reduce((sum, r) => sum + (r.rental_cost || 0), 0) * 0.7
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
          <p className="text-blue-100 mt-2">Manage your rentals and tools</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

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
          ) : pendingRentals.length > 0 ? (
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
                              <p className="text-gray-600 text-sm mt-1">£{rental.daily_rental_rate || 0}/day</p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                              ✓ Active
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
            </>
          ) : activeRentals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRentals.map((rental) => (
                <div key={rental.id} className="bg-white rounded-lg border border-green-200 overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">£{rental.daily_rental_rate || 0}/day</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                        ✓ Active
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
                  {ownerRentals.map((rental) => (
                    <div key={rental.id} className="bg-white rounded-lg border border-green-200 overflow-hidden shadow-sm">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-900">{rental.tools?.name}</h3>
                          <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">
                            ✓ Rented
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
                          <div className="bg-green-50 rounded p-3 text-sm border border-green-200">
                            <p className="text-gray-600">You Earn (70%)</p>
                            <p className="font-semibold text-green-600">£{(rental.rental_cost * 0.7).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Your Tools */}
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
                        <p className="text-2xl font-bold text-blue-600">£{tool.daily_rental_rate || 0}</p>
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
              Start by browsing tools to rent, or list your own tools to earn money when others rent them. You get 70% of every rental!
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
