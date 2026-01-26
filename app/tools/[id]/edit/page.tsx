'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { getSupabase } from '@/lib/supabase';

const categories = ['Power Tools', 'Garden Tools', 'Camping Equipment', 'Sports Equipment', 'Other'];
const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];

export default function EditToolPage() {
  const router = useRouter();
  const params = useParams();
  const { session } = useAuth();
  const toolId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    category: 'Power Tools',
    description: '',
    condition: 'Good',
    toolValue: '',
    postcode: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    const fetchTool = async () => {
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .eq('id', toolId)
          .single();

        if (error) throw error;

        if (data && data.owner_id === session.user?.id) {
          setFormData({
            name: data.name || '',
            category: data.category || 'Power Tools',
            description: data.description || '',
            condition: data.condition || 'Good',
            toolValue: data.tool_value?.toString() || '',
            postcode: data.postcode || '',
          });
        } else {
          setError('You do not have permission to edit this tool.');
        }
      } catch (err) {
        console.error('Error fetching tool:', err);
        setError('Failed to load tool details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [toolId, session, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { error } = await supabase
        .from('tools')
        .update({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          condition: formData.condition,
          tool_value: parseFloat(formData.toolValue) || 0,
          postcode: formData.postcode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', toolId)
        .eq('owner_id', session?.user?.id);

      if (error) throw error;

      router.push('/owner-dashboard');
    } catch (err) {
      console.error('Error updating tool:', err);
      setError('Failed to update tool. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pt-32">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-gray-600">Loading tool details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pt-32">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Tool</h1>
          <p className="text-gray-600">Update your tool details</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {/* Tool Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tool Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Power Drill"
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your tool condition, features, and what's included..."
            />
          </div>

          {/* Condition */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {conditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Rate */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tool Value (£) *
            </label>
            <input
              type="number"
              name="toolValue"
              value={formData.toolValue}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 150"
            />
          </div>

          {/* Postcode */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Postcode *
            </label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., SW1A 1AA"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 text-center bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
