'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ToolOwnerPromo() {
  const { session, loading } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [toolsCount, setToolsCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (session?.user?.id && !loading) {
      const fetchTier = async () => {
        const { data } = await supabase
          .from('users_ext')
          .select('subscription_tier, tools_count')
          .eq('user_id', session.user.id)
          .single();
        setSubscriptionTier(data?.subscription_tier || 'free');
        setToolsCount(data?.tools_count || 0);
        setDataLoaded(true);
      };
      fetchTier();
    } else if (!loading) {
      setDataLoaded(true);
    }
  }, [session?.user?.id, loading]);

  // Don't show while loading
  if (loading || !dataLoaded) {
    return null;
  }

  // Hide banner if user is not logged in
  if (!session) {
    return null;
  }

  // Hide banner if user already has standard/pro (paid or free via tools)
  if (subscriptionTier === 'standard' || subscriptionTier === 'pro' || toolsCount >= 3) {
    return null;
  }

  // Show personalized message based on tools_count
  const remainingTools = 3 - toolsCount;
  const message = toolsCount > 0 
    ? `🎁 You have ${toolsCount} tool${toolsCount > 1 ? 's' : ''} listed! List ${remainingTools} more to unlock Standard free.`
    : '🎁 List 3 Tools, Get Standard Plan Free: Share your tools and unlock premium borrowing benefits.';

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-sm md:text-base">
          <strong>{message}</strong>{' '}
          <Link href="/tools/add" className="underline hover:opacity-80 transition font-semibold">
            List a tool →
          </Link>
        </p>
      </div>
    </div>
  );
}
