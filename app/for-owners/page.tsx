'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForOwnersPage() {
  const { session, loading } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [loadingTier, setLoadingTier] = useState(true);

  useEffect(() => {
    if (session?.user?.id && !loading) {
      const fetchTier = async () => {
        const { data } = await supabase
          .from('users_ext')
          .select('subscription_tier')
          .eq('user_id', session.user!.id)
          .single();
        setSubscriptionTier(data?.subscription_tier || 'free');
        setLoadingTier(false);
      };
      fetchTier();
    } else if (!loading) {
      setLoadingTier(false);
    }
  }, [session?.user?.id, loading]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">List Your Tools</h1>
          <p className="text-xl text-gray-600">Share tools with your community and help neighbours access what they need</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Why List */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why List Tools on ToolTree?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-4xl mb-3">🛠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Keep Tools in Use</h3>
              <p className="text-gray-700">
                Let community members borrow your tools instead of them sitting unused. Reduce waste and maximize utility.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">We Protect You</h3>
              <p className="text-gray-700">
                If a tool is damaged, ToolTree guarantees reimbursement within 48 hours. You're covered.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Community</h3>
              <p className="text-gray-700">
                Be part of a sharing economy that saves money and reduces waste. Help your neighbours.
              </p>
            </div>
          </div>
        </section>

        {/* Free Standard Plan Incentive or Standard Plan Confirmation */}
        {!loadingTier && (subscriptionTier === 'standard' || subscriptionTier === 'pro') ? (
          <section className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">You're on the Standard Plan</h2>
              <p className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto">
                Great news! You've unlocked our Standard plan with premium benefits for borrowers and comprehensive tool protection.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Your Borrowing Limits</p>
                  <p className="text-2xl font-bold text-green-600 mb-4">£0/month</p>
                  <ul className="text-sm text-gray-700 space-y-2 text-left">
                    <li>✓ Borrow up to <strong>2 tools</strong> simultaneously</li>
                    <li>✓ Borrow tools up to <strong>£300</strong> value</li>
                    <li>✓ Keep tools out for <strong>7 days</strong></li>
                    <li>✓ Full damage protection</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Your Owner Protection</p>
                  <ul className="text-sm text-gray-700 space-y-2 text-left">
                    <li>✓ <strong>100% damage coverage</strong></li>
                    <li>✓ Reimbursed within <strong>48 hours</strong></li>
                    <li>✓ Borrower verification</li>
                    <li>✓ Fair dispute resolution</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">How to Maintain</p>
                  <p className="text-sm text-gray-700 mb-4">
                    Keep your Standard plan active by maintaining <strong>3+ tools</strong> in your listing.
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    If you drop below 3 tools, you'll revert to Free. Relist to get Standard back instantly.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/dashboard"
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Free Membership Plans for Tool Owners</h2>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                The more tools you list, the better your plan. List <strong>1 tool</strong> for Basic, or <strong>3 tools</strong> for Standard — all free while your tools remain listed.
              </p>
              
              {/* Two-tier pricing cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Basic Plan */}
                <div className="bg-white rounded-lg p-6 border-2 border-blue-300">
                  <p className="text-sm text-gray-600 mb-2">Basic Plan Benefits</p>
                  <p className="text-2xl font-bold text-blue-600 mb-2">Free with 1+ Tools</p>
                  <p className="text-sm text-gray-500 mb-4">or £2/month to upgrade now</p>
                  <ul className="text-sm text-gray-700 space-y-2 text-left">
                    <li>✓ Borrow up to <strong>1 tool</strong> at a time</li>
                    <li>✓ Borrow tools up to <strong>£100</strong> value</li>
                    <li>✓ Keep tools out for <strong>3 days</strong></li>
                    <li>✓ Full damage protection</li>
                  </ul>
                </div>

                {/* Standard Plan */}
                <div className="bg-white rounded-lg p-6 border-2 border-green-400 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">BEST VALUE</div>
                  <p className="text-sm text-gray-600 mb-2">Standard Plan Benefits</p>
                  <p className="text-2xl font-bold text-green-600 mb-2">Free with 3+ Tools</p>
                  <p className="text-sm text-gray-500 mb-4">or £10/month to upgrade now</p>
                  <ul className="text-sm text-gray-700 space-y-2 text-left">
                    <li>✓ Borrow up to <strong>2 tools</strong> simultaneously</li>
                    <li>✓ Borrow tools up to <strong>£300</strong> value</li>
                    <li>✓ Keep tools out for <strong>7 days</strong></li>
                    <li>✓ Full damage protection</li>
                  </ul>
                </div>
              </div>

              {/* How it works */}
              <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Unlock Free Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-semibold text-blue-600 mb-3">Unlock Basic (1 Tool)</p>
                    <ol className="text-sm text-gray-700 space-y-2 text-left list-decimal ml-4">
                      <li>List your first tool</li>
                      <li>Automatic upgrade to Basic — no action needed</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600 mb-3">Unlock Standard (3 Tools)</p>
                    <ol className="text-sm text-gray-700 space-y-2 text-left list-decimal ml-4">
                      <li>List your second tool</li>
                      <li>List your third tool</li>
                      <li>Automatic upgrade to Standard — no action needed</li>
                    </ol>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mt-6 text-sm">
                These aren't limited-time offers. List tools, get free membership upgrades. Delete tools below the threshold, and you'll revert to the lower tier.
              </p>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign Up & Verify</h3>
                <p className="text-gray-700">Create your account and verify your email, phone, and bank details via Stripe.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">List Your Tools</h3>
                <p className="text-gray-700">Add tools with photos, descriptions, condition, and value. Tools must be safe for general public use.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Accept Borrow Requests</h3>
                <p className="text-gray-700">Review and approve borrow requests from verified members. You control who borrows what.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tools Protected</h3>
                <p className="text-gray-700">If damage occurs, we handle it fairly. Your tools are covered and replacements are managed.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Ownership Guarantee */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Ownership Guarantee</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong>If a tool is damaged while borrowed:</strong>
            </p>
            <ul className="space-y-2 ml-4 list-disc">
              <li>ToolTree investigates the damage claim within 48 hours</li>
              <li>If approved, you're paid in full within 48 hours</li>
              <li>You don't wait for borrower disputes or payment recovery</li>
              <li>We pursue the borrower for reimbursement separately</li>
            </ul>
            <p className="pt-4 border-t border-blue-200">
              <strong>Bottom line:</strong> Your tool is always protected. If something goes wrong, we make it right.
            </p>
          </div>
        </section>

        {/* What You Can List */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What You Can List</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="font-semibold text-green-900 mb-3">Allowed on ToolTree</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ DIY and hand tools</li>
                <li>✓ Garden and lawn tools</li>
                <li>✓ Home maintenance tools</li>
                <li>✓ Non-specialist power tools</li>
                <li>✓ Cleaning equipment</li>
                <li>✓ Ladders and scaffolding</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="font-semibold text-red-900 mb-3">NOT Allowed</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✗ Firearms or weapons</li>
                <li>✗ Explosives or fireworks</li>
                <li>✗ Vehicles or powered transport</li>
                <li>✗ Medical equipment</li>
                <li>✗ Industrial machinery</li>
                <li>✗ Tools requiring professional licenses</li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-6">
            ToolTree reserves the right to remove listings that pose safety risks or violate community guidelines.
          </p>
        </section>

        {/* Verification */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Before You List: Verification</h2>
          
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Email Verification</h3>
              <p className="text-gray-700 text-sm">Confirm your email address (takes 1 minute)</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Phone Verification</h3>
              <p className="text-gray-700 text-sm">Confirm your phone number via SMS (takes 1 minute)</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Bank Account Verification</h3>
              <p className="text-gray-700 text-sm">Connect your bank via Stripe for secure payouts (takes 2-3 minutes, you'll be verified instantly)</p>
            </div>
          </div>

          <p className="text-gray-700 mt-6">
            We verify owners to protect the entire community. This is quick, secure, and required only once. Your payment information is handled entirely by Stripe — we never see your bank details.
          </p>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <ol className="space-y-4 text-gray-700">
              <li className="flex gap-4">
                <span className="text-2xl font-bold text-blue-600 flex-shrink-0">1.</span>
                <span>List your tools with photos and basic info</span>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl font-bold text-blue-600 flex-shrink-0">2.</span>
                <span>Approve or decline borrowing requests from neighbours</span>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl font-bold text-blue-600 flex-shrink-0">3.</span>
                <span>Get notified when tools are returned</span>
              </li>
              <li className="flex gap-4">
                <span className="text-2xl font-bold text-blue-600 flex-shrink-0">4.</span>
                <span>If damage is reported, we handle the claim fairly</span>
              </li>
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to List Your Tools?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join ToolTree owners and make a difference. It takes less than 5 minutes to sign up and verify.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign Up as Owner
          </Link>
        </section>

        {/* FAQ */}
        <section className="border-t border-gray-200 pt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Common Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a cost to list tools?</h3>
              <p className="text-gray-700">
                No. Listing tools is completely free. There are no fees, no commission, and no hidden charges.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if a tool goes missing?</h3>
              <p className="text-gray-700">
                If a tool isn't returned after the grace period, the borrower's account is flagged. ToolTree investigates and ensures the owner is reimbursed for the full tool value (up to the borrower's tier limit).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I see who's borrowing my tools?</h3>
              <p className="text-gray-700">
                Yes. You review and approve every borrow request before it's approved. You see the borrower's name, verification status, and can make an informed decision.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I disagree with a damage decision?</h3>
              <p className="text-gray-700">
                You can appeal any damage decision. ToolTree reviews both sides fairly, and disputes are resolved within 48 hours. You can also provide photos or evidence of the tool's condition before/after.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I remove a tool from my listing?</h3>
              <p className="text-gray-700">
                Yes, anytime. If a tool is currently borrowed, it will complete that borrow cycle first. You can also mark tools as unavailable temporarily.
              </p>
            </div>
          </div>
        </section>

        {/* Safety Link */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Want More Details?</h3>
          <p className="text-gray-700 mb-4">
            Read our full <Link href="/safety" className="text-blue-600 hover:text-blue-700 font-semibold">Safety & Trust</Link> page to understand damage coverage, our guarantee, and how we protect the community.
          </p>
        </section>

      </div>
    </div>
  );
}
