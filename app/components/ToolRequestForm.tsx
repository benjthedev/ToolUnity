'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';

interface ToolRequestFormProps {
  onRequestCreated: () => void;
}

const CATEGORIES = [
  'Hand Tools',
  'Power Tools',
  'Cleaning',
  'Safety',
  'Other',
];

export default function ToolRequestForm({ onRequestCreated }: ToolRequestFormProps) {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    toolName: '',
    category: '',
    postcode: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!session?.user) {
      setError('You must be logged in to request a tool');
      return;
    }

    if (!formData.toolName || !formData.category || !formData.postcode) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/tool-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccess(true);
      setFormData({ toolName: '', category: '', postcode: '', description: '' });
      onRequestCreated();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📢</span>
          <h3 className="text-lg font-bold text-gray-900">Can&apos;t find what you need?</h3>
        </div>
        <p className="text-gray-600 mb-3">
          Sign in to request a tool and let local owners know there&apos;s demand in your area.
        </p>
        <a
          href="/login"
          className="inline-block bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
        >
          Sign in to Request
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📢</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Can&apos;t find what you need?</h3>
            <p className="text-sm text-gray-600">Request a tool and let local owners know there&apos;s demand</p>
          </div>
        </div>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-orange-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition whitespace-nowrap"
          >
            + Request a Tool
          </button>
        )}
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Tool Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Pressure Washer"
                value={formData.toolName}
                onChange={(e) => setFormData({ ...formData, toolName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Your Postcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. NR12 9RR"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              placeholder="Any specific details about the tool you need..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm">
              ✅ Your tool request has been submitted! Others can now upvote it.
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError('');
                setSuccess(false);
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
