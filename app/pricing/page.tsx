'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TierSummary from '@/app/components/TierSummary';
import { useRouter } from 'next/navigation';
import { showToast } from '@/app/utils/toast';
import { calculateEffectiveTier } from '@/app/utils/tierCalculation';

const pricingTiers = [
  {
    name: 'Basic',
    price: '£2.00',
    period: '/month',
    description: 'Start borrowing with essential access',
    useCase: 'Occasional projects',
    features: [
      '✓ Max 1 active borrow at a time',
      '✓ Up to £100 tool value',
      '✓ Up to 3 days per borrow',
      '✓ Browse tools in your area',
      '✓ Make borrowing requests',
    ],
    waiver: 'Free if you list 1+ tools',
    cta: 'Subscribe',
    priceId: 'price_1SmI9kBt1LczyCVDZeEMqvMJ',
  },
  {
    name: 'Standard',
    price: '£10.00',
    period: '/month',
    description: 'For regular tool borrowers',
    useCase: 'DIY & home maintenance',
    features: [
      '✓ Max 2 active borrows at a time',
      '✓ Up to £300 tool value',
      '✓ Up to 7 days per borrow',
      '✓ Browse all available tools',
      '✓ Priority request reviews',
      '✓ Help & support',
    ],
    waiver: 'Free if you list 3+ tools',
    trial: '14 days free trial',
    cta: 'Subscribe',
    priceId: 'price_1Sk7XZBt1LczyCVDOPofihFZ',
    highlighted: true,
    badge: 'Best Value',
  },
  {
    name: 'Pro',
    price: '£25.00',
    period: '/month',
    description: 'For power users (Coming Soon)',
    useCase: 'Renovations & frequent projects',
    features: [
      '✓ Max 5 active borrows at a time',
      '✓ Up to £1,000 tool value',
      '✓ Up to 14 days per borrow',
      '✓ Unlimited tool access',
      '✓ Priority support',
      '✓ No cooldown between borrows',
    ],
    trial: '14 days free trial',
    comingSoon: true,
    cta: 'Subscribe',
    priceId: 'price_1Sk7YbBt1LczyCVDef9jBhUV',
  },
];

export default function PricingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [activeToolCount, setActiveToolCount] = useState(0);
  const [effectiveTier, setEffectiveTier] = useState<string | null>(null);
  const [isPaidTier, setIsPaidTier] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [loadingTier, setLoadingTier] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id && !loading) {
      const fetchTier = async () => {
        console.log('PRICING: Starting fetchTier for user:', session?.user?.id);
        
        // Sync subscription with Stripe to get latest status
        try {
          await fetch('/api/sync-subscription', {
            method: 'POST',
          });
        } catch (err) {
          console.error('Error syncing subscription:', err);
        }
        
        const { data, error } = await supabase
          .from('users_ext')
          .select('subscription_tier, tools_count')
          .eq('user_id', session?.user?.id || '')
          .single();
        
        console.log('PRICING: User data fetched:', data);
        if (error) {
          console.error('PRICING: Supabase error:', error);
        }
        
        if (data) {
          setSubscriptionTier(data.subscription_tier || 'none');
          
          // Always recount tools from database to ensure accuracy
          const { data: userTools } = await supabase
            .from('tools')
            .select('id')
            .eq('owner_id', session?.user?.id);
          
          const actualToolCount = userTools?.length || 0;
          console.log('PRICING: Actual tool count:', actualToolCount);
          setActiveToolCount(actualToolCount);
          
          // Use consolidated tier calculation logic with actual tool count
          const tierInfo = calculateEffectiveTier(
            data.subscription_tier,
            actualToolCount
          );
          
          console.log('PRICING PAGE - Tier Calculation:', {
            subscriptionTier: data.subscription_tier,
            actualToolCount,
            calculatedTier: tierInfo.effectiveTier,
            isFreeTier: tierInfo.isFreeTier,
          });
          
          setEffectiveTier(tierInfo.effectiveTier);
          setIsPaidTier(!tierInfo.isFreeTier && data.subscription_tier && ['basic', 'standard', 'pro'].includes(data.subscription_tier));
          
          console.log('PRICING: State updated with tier:', tierInfo.effectiveTier);
        }
        setLoadingTier(false);
      };
      fetchTier();
    } else if (!loading) {
      setLoadingTier(false);
    }
  }, [session?.user?.id, loading]);

  const handleCheckout = async (priceId: string) => {
    console.log('handleCheckout called with priceId:', priceId);
    console.log('session:', session);
    
    if (!session) {
      console.log('No session, redirecting to signup');
      router.push('/signup');
      return;
    }

    setCheckoutLoading(true);
    try {
      console.log('Creating checkout session with userId:', session.user?.id);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: session.user?.id,
          email: session.user?.email,
        }),
      });

      const data = await response.json();
      console.log('Checkout session response:', data);
      
      if (data.error) {
        showToast('Failed to initiate checkout', 'error');
        return;
      }

      // Redirect to Stripe hosted checkout using the URL returned by Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Failed to get checkout URL', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to initiate checkout', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Through Contribution or Payment</h1>
            <p className="text-gray-700 text-lg mb-2">
              ToolUnity works on a fairness model: you can build free borrowing access by sharing your tools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-2">📋 Path 1: List Tools</h3>
              <p className="text-gray-700 mb-3 text-sm">
                Build free borrowing access by sharing your tools with your community.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ List 1 tool → Basic (£0/mo)</li>
                <li>✓ List 3 tools → Standard (£0/mo)</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-lg text-gray-900 mb-2">💵 Path 2: Subscribe</h3>
              <p className="text-gray-700 mb-3 text-sm">
                Or subscribe directly for immediate, premium borrowing access.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Basic → £2/mo</li>
                <li>✓ Standard → £10/mo</li>
                <li>✓ Pro → £25/mo</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-gray-600 text-base mt-6 font-semibold">
            Choose what works for you—both paths are equally respected.
          </p>
        </div>
      </section>

      {/* Your Current Tier Section */}
      {session && !loadingTier && effectiveTier && effectiveTier !== 'none' && (
        <section className="bg-white border-b-2 border-gray-200 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Current Tier</h2>
            <TierSummary
              effectiveTier={effectiveTier as 'basic' | 'standard' | 'pro'}
              toolsCount={activeToolCount}
              isPaidTier={isPaidTier}
              showNextUnlock={true}
              compact={false}
            />
          </div>
        </section>
      )}

      {/* Tool Owner Incentive Banner */}
      {session ? (
        <section className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-b-2 border-emerald-300 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {!loadingTier && effectiveTier === 'standard' && activeToolCount >= 3 ? (
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg mb-2">✅ Standard Tier Unlocked!</p>
                <p className="text-gray-700 mb-3">
                  You have {activeToolCount} tools listed. You've unlocked Standard tier (2 active borrows, £300 coverage, 7 days) as long as your tools remain listed.
                </p>
                <Link href="/dashboard" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition">
                  View Dashboard →
                </Link>
              </div>
            ) : !loadingTier && effectiveTier !== 'standard' && effectiveTier !== 'pro' && activeToolCount >= 1 && activeToolCount < 3 ? (
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg mb-2">🎁 {3 - activeToolCount} More Tool{3 - activeToolCount !== 1 ? 's' : ''} to Unlock Standard</p>
                <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-4 inline-block">
                  <p className="text-gray-700 mb-2">Progress: <strong>{activeToolCount}/3 tools listed</strong></p>
                  <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                    <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${(activeToolCount / 3) * 100}%` }}></div>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">
                  List {3 - activeToolCount} more tool{3 - activeToolCount !== 1 ? 's' : ''} to unlock Standard (2 active borrows, £300 value, 7 days) free.
                </p>
                <Link href="/tools/add" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
                  List Tool #{activeToolCount + 1}
                </Link>
              </div>
            ) : !loadingTier && effectiveTier !== 'basic' && effectiveTier !== 'standard' && effectiveTier !== 'pro' && activeToolCount === 0 ? (
              <div className="text-center">
                <p className="text-gray-900 font-bold text-lg mb-2">🎁 List Tools to Unlock Free Membership</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-gray-700"><strong>1 tool</strong> = Basic free (1 borrow, £100 value, 3 days)</p>
                  </div>
                  <div className="bg-white bg-opacity-60 rounded-lg p-4">
                    <p className="text-gray-700"><strong>3 tools</strong> = Standard free (2 borrows, £300 value, 7 days)</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">No monthly fee—borrowing access unlocked by listing.</p>
                <Link href="/tools/add" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
                  Get Started Listing
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-b-2 border-emerald-300 py-8 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-900 font-bold text-lg mb-2">🎁 List Tools to Unlock Free Membership</p>
            <p className="text-gray-700 mb-4">
              List 1 tool to unlock Basic free, or 3 tools for Standard free. No monthly fee required.
            </p>
            <Link href="/signup" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold transition">
              Sign Up & Start Listing
            </Link>
          </div>
        </section>
      )}

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => {
            // Determine if this tier should be highlighted
            const tierNameLower = tier.name.toLowerCase();
            const isCurrentTier = session && effectiveTier && effectiveTier === tierNameLower;
            const shouldHighlight = session && isCurrentTier ? true : !session && tier.name === 'Standard';
            
            // Debug logging
            if (tier.name === 'Basic') {
              console.log('Basic tier check:', {
                session: !!session,
                effectiveTier,
                tierNameLower,
                isCurrentTier,
              });
            }
            
            return (
            <div
              key={tier.name}
              className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 relative bg-white ${
                shouldHighlight ? 'ring-2 ring-blue-600 md:scale-105' : ''
              } ${tier.comingSoon ? 'opacity-75' : ''}`}
            >
              {tier.comingSoon && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 text-xs font-bold">
                  Coming Soon
                </div>
              )}
              {!session && tier.badge && !tier.comingSoon && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white px-4 py-1 text-xs font-bold">
                  {tier.badge}
                </div>
              )}
              {session && isCurrentTier && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 text-xs font-bold">
                  Your Tier
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{tier.description}</p>
                <p className="text-xs text-blue-600 font-semibold mb-4">{tier.useCase}</p>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                  {tier.period && <span className="text-gray-600">{tier.period}</span>}
                </div>
                {tier.waiver && (
                  <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded mb-4">
                    {tier.waiver}
                  </p>
                )}
                {tier.trial && (
                  <p className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded mb-6 font-semibold">
                    🎁 {tier.trial}
                  </p>
                )}

                {loadingTier && (
                  <div className="block w-full text-center py-3 px-4 rounded-lg font-semibold mb-8 bg-gray-100 text-gray-600">
                    Loading...
                  </div>
                )}

                {!loadingTier && tier.name === 'Pro' && (
                  <div className="block w-full text-center py-3 px-4 rounded-lg font-semibold mb-8 bg-gray-100 text-gray-600">
                    Coming Soon
                  </div>
                )}

                {!loadingTier && tier.name !== 'Pro' && session && tierNameLower === effectiveTier && (
                  <div className="block w-full text-center py-3 px-4 rounded-lg font-semibold mb-8 bg-green-100 text-green-800 border-2 border-green-500">
                    ✓ Your Tier
                  </div>
                )}

                {!loadingTier && tier.name !== 'Pro' && !session && (
                  <Link
                    href="/signup"
                    className="block w-full text-center py-3 px-4 rounded-lg font-semibold mb-8 transition-colors bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Start Free Trial
                  </Link>
                )}

                {!loadingTier && tier.name !== 'Pro' && session && tierNameLower !== effectiveTier && (
                  <button
                    onClick={() => handleCheckout(tier.priceId)}
                    disabled={checkoutLoading}
                    className="block w-full text-center py-3 px-4 rounded-lg font-semibold mb-8 transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {checkoutLoading ? 'Processing...' : 'Start Free Trial'}
                  </button>
                )}

                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <span className="text-green-500 mr-3">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How Protection Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Free Tier</p>
              <p className="text-2xl font-bold text-gray-900">£100</p>
              <p className="text-xs text-gray-600 mt-2">Damage liability cap</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Standard Tier</p>
              <p className="text-2xl font-bold text-gray-900">£300</p>
              <p className="text-xs text-gray-600 mt-2">Damage liability cap</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-gray-600 mb-2">Pro Tier</p>
              <p className="text-2xl font-bold text-gray-900">£1,000</p>
              <p className="text-xs text-gray-600 mt-2">Damage liability cap</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What If Something Breaks?</h3>
            <p className="text-gray-700 mb-4">
              If you damage a tool beyond normal wear:
            </p>
            <ol className="space-y-3 text-gray-700 ml-4 list-decimal">
              <li>The damage is reported during return</li>
              <li>You have 48 hours to respond</li>
              <li>We review evidence from both sides</li>
              <li>If damage is confirmed, you're charged (up to the value of the tool)</li>
              <li>Owner is reimbursed within 48 hours</li>
            </ol>
            <p className="text-gray-700 mt-6 pt-6 border-t border-gray-200">
              <strong>Fair, transparent, and simple.</strong> Learn more on our <Link href="/safety" className="text-blue-600 hover:text-blue-700 font-semibold">Safety & Trust page</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Original FAQ */}
      <section id="faq" className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What is ToolUnity?</h3>
              <p className="text-gray-600">ToolUnity is a peer-to-peer tool-sharing marketplace. Borrow tools from neighbours instead of buying expensive equipment you'll only use once or twice. Save money, reduce waste, build community.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is browsing really free?</h3>
              <p className="text-gray-600">Yes! You can browse all available tools without an account or payment. To make a borrowing request, you need a free or paid membership—or you can unlock free membership by listing tools.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I borrow tools?</h3>
              <p className="text-gray-600">You need active membership to borrow. Options:</p>
              <ul className="list-disc ml-6 mt-2 text-gray-600 space-y-1">
                <li><strong>Subscribe to a plan:</strong> Basic (£2/mo) or Standard (£10/mo). Pro (£25/mo) Coming Soon</li>
                <li><strong>List tools for free:</strong> 1 tool = Basic free, 3 tools = Standard free</li>
              </ul>
              <p className="text-gray-600 mt-2">Once you have membership, browse tools and submit requests. Owners review and approve requests based on availability.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What does each plan include?</h3>
              <p className="text-gray-600"><strong>Basic (£2/mo or free with 1+ tools):</strong> 1 active borrow, £100 value limit, 3 days</p>
              <p className="text-gray-600 mt-2"><strong>Standard (£10/mo or free with 3+ tools):</strong> 2 active borrows, £300 value limit, 7 days</p>
              <p className="text-gray-600 mt-2"><strong>Pro (£25/mo - Coming Soon):</strong> 5 active borrows, £1,000 value limit, 14 days</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Do paid plans have a trial period?</h3>
              <p className="text-gray-600">Yes! All paid plans (Basic and Standard) include a <strong>14-day free trial</strong>. Try any plan risk-free. You won't be charged until your trial ends. Cancel anytime before your trial ends and you won't be charged at all. Pro will also include a trial when it launches.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I get free membership by listing tools?</h3>
              <p className="text-gray-600">Yes! List 1 tool to unlock Basic free, or 3 tools to unlock Standard free. As long as your tools stay listed and available, your free membership remains active. If you delete tools below the threshold, you lose the benefit.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600">Yes! If you're on a paid plan, change instantly. Downgrading takes effect at your next billing cycle. Free memberships (unlocked by listing) have no billing—they're automatic based on your tool count.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What are value limits?</h3>
              <p className="text-gray-600">Value limits protect both you and owners. The limit is the total retail value of all tools you can borrow at once. For example, Basic lets you borrow items worth up to £100 combined (like one £100 drill or multiple smaller tools totaling £100).</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
