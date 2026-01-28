'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ToolOwnerBadge from '@/app/components/ToolOwnerBadge';
import { showToast } from '@/app/utils/toast';

export default function ProfilePage() {
  const { session, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState('none');
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [postcode, setPostcode] = useState('');
  const [toolsCount, setToolsCount] = useState(0);
  const [effectiveTier, setEffectiveTier] = useState('none');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [isPaidTier, setIsPaidTier] = useState(false);

  useEffect(() => {
    if (session?.user?.id && !loading) {
      fetchProfile();
    } else if (!loading) {
      setLoadingProfile(false);
    }
  }, [session?.user?.id, loading]);

  const fetchProfile = async () => {
    try {
      // Sync subscription with Stripe to get latest status
      try {
        await fetch('/api/sync-subscription', {
          method: 'POST',
        });
      } catch (err) {
        // Silently continue on sync error
      }
      
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
        setSubscriptionTier(data.subscription_tier || 'none');
        setToolsCount(data.tools_count || 0);
        
        // Calculate effective tier
        let tier = data.subscription_tier || 'none';
        const hasPaidTier = data.subscription_tier === 'basic' || data.subscription_tier === 'standard' || data.subscription_tier === 'pro';
        setIsPaidTier(hasPaidTier);
        
        if (hasPaidTier) {
          tier = data.subscription_tier;
        } else if (data.tools_count >= 3) {
          tier = 'standard';
        } else if (data.tools_count >= 1 && (tier === 'none' || tier === 'basic')) {
          tier = 'basic';
        }
        setEffectiveTier(tier);
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

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open subscription portal');
        showToast('Failed to open subscription portal', 'error');
      }
    } catch (err) {
      setError('Failed to open subscription portal');
      showToast('Failed to open subscription portal', 'error');
    } finally {
      setPortalLoading(false);
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
                {toolsCount > 0 && (
                  <ToolOwnerBadge 
                    toolsCount={toolsCount}
                    subscriptionTier={subscriptionTier}
                    size="md"
                  />
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
                  <p className="mt-1 text-sm text-gray-500">So tool owners can contact you</p>
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
                  <p className="mt-1 text-sm text-gray-500">Used to find tools near you</p>
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

          {/* Subscription Info Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tier Status</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Current Tier</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {effectiveTier === 'basic' && '✨ Basic'}
                    {effectiveTier === 'standard' && '⭐ Standard'}
                    {effectiveTier === 'pro' && '👑 Pro'}
                    {effectiveTier === 'none' && '🔍 Browse Only'}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Your Tools Listed</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{toolsCount}</span>
                      <span className="text-gray-500">tool{toolsCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-gray-600 mb-2">Unlock Status</p>
                    <div className="space-y-2">
                      <div className={`p-2 rounded ${toolsCount >= 1 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className={`text-xs font-semibold ${toolsCount >= 1 ? 'text-green-700' : 'text-gray-600'}`}>
                          {toolsCount >= 1 ? '✓' : '○'} 1 tool → Basic
                        </p>
                      </div>
                      <div className={`p-2 rounded ${toolsCount >= 3 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className={`text-xs font-semibold ${toolsCount >= 3 ? 'text-green-700' : 'text-gray-600'}`}>
                          {toolsCount >= 3 ? '✓' : '○'} 3 tools → Standard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                {isPaidTier && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="block w-full text-center bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? 'Loading...' : 'Manage Subscription'}
                  </button>
                )}
                <Link
                  href="/pricing"
                  className="block w-full text-center bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  View All Plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
