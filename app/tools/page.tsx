'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { getSupabase } from '@/lib/supabase';
import { ToolCardSkeleton } from '@/app/components/LoadingSkeletons';
import ToolMap from '@/app/components/ToolMap';
import ToolRequestForm from '@/app/components/ToolRequestForm';
import ToolRequestList from '@/app/components/ToolRequestList';

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

interface Tool {
  id: string;
  name: string;
  category: string;
  owner_id: string;
  postcode: string;
  available: boolean;
  tool_value: number;
  daily_rate?: number;
  image_url?: string;
}

export default function ToolsPage() {
  const { session } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [toolRequests, setToolRequests] = useState<ToolRequest[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<string[]>([]);
  const pageSize = 20; // Items per page
  const [filters, setFilters] = useState({
    category: '',
    postcode: '',
    availability: true,
  });

  const categories = [...new Set(tools.map((t) => t.category))];
  const postcodes = [...new Set(tools.map((t) => t.postcode))];

  const fetchToolRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/tool-requests');
      const data = await response.json();
      if (response.ok) {
        setToolRequests(data.requests || []);
        setUserUpvotes(data.userUpvotes || []);
      }
    } catch (err) {
      console.error('Error fetching tool requests:', err);
    }
  }, []);

  useEffect(() => {
    fetchTools();
    fetchToolRequests();
  }, [currentPage, filters, fetchToolRequests]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const sb = getSupabase();
      
      // Calculate pagination
      const offset = (currentPage - 1) * pageSize;

      // Build query with pagination
      let query = sb.from('tools').select('*', { count: 'exact' }).is('deleted_at', null);
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.postcode) {
        // Use ilike for partial postcode matching (case-insensitive)
        query = query.ilike('postcode', `${filters.postcode.toUpperCase()}%`);
      }
      if (filters.availability) {
        query = query.eq('available', true);
      }

      // Add pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        // Database error - show empty state
        setTools([]);
        setTotalPages(1);
        throw error;
      }
      
      if (data && data.length > 0) {
        setTools(data);
        // Calculate total pages
        const calculated = count ? Math.ceil(count / pageSize) : 1;
        setTotalPages(calculated);
      } else {
        // No tools found matching filters
        setTools([]);
        setTotalPages(1);
      }
    } catch (err) {
      // Database error - show empty state
      setTools([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter((tool) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Available Tools</h1>
          <p className="text-gray-600 mt-1">{filteredTools.length} tools found</p>
        </div>
      </div>

      {/* Search & Filter Section */}
      {viewMode === 'list' && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <input
              type="text"
              placeholder="Search tools by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
            />
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Postcode Area</label>
                <input
                  type="text"
                  placeholder="e.g. SW1A"
                  value={filters.postcode}
                  onChange={(e) => setFilters({ ...filters, postcode: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ category: '', postcode: '', availability: true })}
                  className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors text-base ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors text-base ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                🗺️ Map
              </button>
            </div>
          </div>

        {/* Map View */}
        {viewMode === 'map' && !loading && (
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex flex-col">
            <div className="flex-1 rounded-lg border border-gray-200 overflow-hidden shadow-lg">
              <ToolMap tools={filteredTools} toolRequests={toolRequests} />
            </div>
            <div className="absolute top-4 left-4 z-10 flex items-end gap-2 bg-white rounded-lg p-2 shadow-lg">
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white"
              >
                🗺️ Map
              </button>
            </div>
          </div>
        )}

        {/* Tools Grid - Only show in list view */}
        {/* Tool Request Form */}
        <ToolRequestForm onRequestCreated={fetchToolRequests} />

        {/* Tool Requests List */}
        <ToolRequestList
          requests={toolRequests}
          userUpvotes={userUpvotes}
          onUpvote={fetchToolRequests}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ToolCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-48 flex items-center justify-center text-5xl overflow-hidden">
                  {tool.image_url ? (
                    <img
                      src={tool.image_url}
                      alt={tool.name}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    '🔧'
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{tool.category}</p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      📍 {tool.postcode}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      £{tool.daily_rate || 3}
                      <span className="text-xs text-gray-600">/day</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-xl text-gray-600 mb-4">No tools match your search</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({ category: '', postcode: '', availability: true });
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Clear filters and try again
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredTools.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && !loading && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ToolMap tools={filteredTools} toolRequests={toolRequests} />
          </div>
          <div className="absolute top-4 left-4 z-10 flex items-end gap-2 bg-white rounded-lg p-2 shadow-lg">
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white"
            >
              🗺️ Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
