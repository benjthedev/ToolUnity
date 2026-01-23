'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import { ToolCardSkeleton } from '@/app/components/LoadingSkeletons';

interface Tool {
  id: string;
  name: string;
  category: string;
  owner_id: string;
  postcode: string;
  available: boolean;
  tool_value: number;
  image_url?: string;
}

// Mock data for demonstration
const MOCK_TOOLS: Tool[] = [
  {
    id: '1',
    name: 'Power Drill - DeWalt 20V',
    category: 'Power Tools',
    owner_id: 'demo-owner-1',
    postcode: '10001',
    available: true,
    tool_value: 150,
  },
  {
    id: '2',
    name: 'Circular Saw - Makita',
    category: 'Power Tools',
    owner_id: 'demo-owner-2',
    postcode: '10002',
    available: true,
    tool_value: 200,
  },
  {
    id: '3',
    name: 'Complete Hand Tool Set',
    category: 'Hand Tools',
    owner_id: 'demo-owner-1',
    postcode: '10001',
    available: true,
    tool_value: 85,
  },
  {
    id: '4',
    name: 'Garden Hose - 50ft Retractable',
    category: 'Garden',
    owner_id: 'demo-owner-3',
    postcode: '10003',
    available: true,
    tool_value: 35,
  },
  {
    id: '5',
    name: 'Extension Ladder - 20ft Aluminum',
    category: 'Ladders',
    owner_id: 'demo-owner-2',
    postcode: '10002',
    available: true,
    tool_value: 120,
  },
  {
    id: '6',
    name: 'Pressure Washer - 2500 PSI',
    category: 'Cleaning',
    owner_id: 'demo-owner-1',
    postcode: '10001',
    available: true,
    tool_value: 250,
  },
  {
    id: '7',
    name: 'Tile Saw - Wet Saw',
    category: 'Power Tools',
    owner_id: 'demo-owner-4',
    postcode: '10004',
    available: true,
    tool_value: 300,
  },
  {
    id: '8',
    name: 'Impact Driver Set',
    category: 'Power Tools',
    owner_id: 'demo-owner-3',
    postcode: '10003',
    available: true,
    tool_value: 110,
  },
];

export default function ToolsPage() {
  const { session } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    postcode: '',
    availability: true,
  });

  const categories = [...new Set(tools.map((t) => t.category))];
  const postcodes = [...new Set(tools.map((t) => t.postcode))];

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed:', error);
        console.log('Switching to demo/mock data mode');
        setTools(MOCK_TOOLS);
        setUseMockData(true);
        throw error;
      }
      
      // If we got data, use it
      if (data && data.length > 0) {
        setTools(data);
        setUseMockData(false);
      } else {
        // If no data but no error, use mock data for demo
        console.log('No tools found, using demo data');
        setTools(MOCK_TOOLS);
        setUseMockData(true);
      }
    } catch (err) {
      console.error('Error fetching tools:', err);
      // Fall back to mock data
      setTools(MOCK_TOOLS);
      setUseMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filters.category && tool.category !== filters.category) return false;
    if (filters.postcode && tool.postcode !== filters.postcode) return false;
    if (filters.availability && !tool.available) return false;
    return true;
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
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
        </div>

        {/* Demo Banner */}
        {useMockData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-8">
            <p className="text-sm text-blue-800">
              📌 Currently showing demo data. Check SUPABASE_SETUP.md to connect your real database.
            </p>
          </div>
        )}

        {/* Tools Grid */}
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
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 h-48 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">
                  {tool.image_url ? (
                    <img
                      src={tool.image_url}
                      alt={tool.name}
                      className="w-full h-full object-cover"
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
                    <span className="text-lg font-bold text-blue-600">
                      £{tool.tool_value}
                      <span className="text-xs text-gray-600"> value</span>
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
      </div>
    </div>
  );
}
