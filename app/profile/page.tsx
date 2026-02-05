'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { showToast } from '@/app/utils/toast';

export default function ProfilePage() {
  const { session, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [postcode, setPostcode] = useState('');
  const [toolsCount, setToolsCount] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user?.id && !loading) {
      fetchProfile();
    } else if (!loading) {
      setLoadingProfile(false);
    }
  }, [session?.user?.id, loading]);

  const fetchProfile = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users_ext')
        .select('*')
        .eq('user_id', session?.user?.id || '')
        .single();

      if (fetchError) {
        setError('Failed to load profile');
      } else if (data) {
        setUsername(data.username || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phone_number || '');
        setPostcode(data.postcode || '');
        setToolsCount(data.tools_count || 0);
      }
    } catch (err) {
      setError('An error occurred while loading your profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveMessage('');

    if (!username.trim()) {
      setError('Username is required');
      showToast('Username is required', 'error');
      setSaving(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      showToast('Username must be at least 3 characters', 'error');
      setSaving(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('users_ext')
        .update({
          username: username.trim(),
          phone_number: phone_number.trim() || null,
          postcode: postcode.trim() || null,
        })
        .eq('user_id', session?.user?.id || '');

      if (updateError) {
        setError('Failed to save profile: ' + updateError.message);
        showToast('Failed to save profile', 'error');
      } else {
        setSaveMessage('Profile saved successfully!');
        showToast('Profile saved successfully!', 'success');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      showToast('An unexpected error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">You need to sign in to view your profile</p>
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account settings</p>
            </div>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
                {toolsCount >= 3 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                    ⭐ Top Owner
                  </span>
                )}
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {saveMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                  {saveMessage}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username *
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your display name"
                    required
                    minLength={3}
                  />
                  <p className="mt-1 text-sm text-gray-500">Minimum 3 characters</p>
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    value={phone_number}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                    Postcode
                  </label>
                  <input
                    type="text"
                    id="postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your postcode"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>

          {/* Account Status Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Activity</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Tools Listed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {toolsCount} tool{toolsCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <p className="text-gray-600">
                    List tools to earn 80% of each rental. No fees until you make money!
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <Link
                  href="/tools/add"
                  className="block w-full text-center bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  List a Tool
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full text-center bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
