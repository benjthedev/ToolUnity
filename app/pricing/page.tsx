'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { showToast } from '@/app/utils/toast';

const borrowingPlans = [
  {
    name: 'Pay Per Use',
    description: 'Perfect for occasional borrowing',
    useCase: 'One-off projects',
    features: [
      '✓ Rent any tool',
      '✓ No subscription required',
      '✓ £1-5 per day per tool',
      '✓ Damage protection included',
      '✓ Up to 14 days per borrow',
    ],
    note: 'Pay as you go—no commitments',
    cta: 'Browse Tools',
  },
];

const ownerInfo = {
  title: 'Own Tools? Earn Money',
  description: 'Get paid every time someone borrows your tools',
  features: [
    '✓ List tools for free',
    '✓ Earn 70% of every rental',
    '✓ We handle damage claims',
    '✓ Monthly payouts to your bank',
    '✓ No fees or hidden costs',
  ],
};

export default function PricingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [ownerStats, setOwnerStats] = useState({ toolsCount: 0, monthlyEarnings: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (session?.user?.id && !loading) {
      const fetchStats = async () => {
        const { data: userTools } = await supabase
          .from('tools')
          .select('id')
          .eq('owner_id', session.user?.id);
        
        setOwnerStats({
          toolsCount: userTools?.length || 0,
          monthlyEarnings: 0, // TODO: Calculate from completed borrows
        });
        setLoadingStats(false);
      };
      fetchStats();
    } else if (!loading) {
      setLoadingStats(false);
    }
  }, [session?.user?.id, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Banner - New Rental Model */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-300 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Rent Tools from Your Neighbors
          </h1>
          <p className="text-xl text-gray-700 mb-4">
            Borrow what you need, share what you have. Pay-per-use, no subscriptions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-blue-600 mb-3">Borrowers</h3>
              <p className="text-gray-700 text-lg font-semibold mb-2">£1-5 per day</p>
              <p className="text-gray-600 mb-4">Browse tools in your area. Rent for a day, a week, or longer. No membership required.</p>
              <Link href="/tools" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                Browse Tools →
              </Link>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-green-600 mb-3">Owners</h3>
              <p className="text-gray-700 text-lg font-semibold mb-2">Earn 70% per rental</p>
              <p className="text-gray-600 mb-4">List your tools free. Get paid every time someone borrows. We handle all the protection.</p>
              <Link href="/tools/add" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
                List Your Tools →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Borrowers Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">How to Borrow</h2>
          <p className="text-gray-600 text-lg text-center mb-12 max-w-2xl mx-auto">
            Simple, flexible, transparent pricing for tool rentals.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-blue-600">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full font-bold text-lg mb-4">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Tools</h3>
              <p className="text-gray-600">Find the tool you need in your area. See prices, photos, and owner reviews.</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-blue-600">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full font-bold text-lg mb-4">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Rental</h3>
              <p className="text-gray-600">Choose your rental dates. Owner reviews your request and confirms (usually within 24 hours).</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-blue-600">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full font-bold text-lg mb-4">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pay & Pick Up</h3>
              <p className="text-gray-600">Pay through ToolUnity. Arrange pickup time with owner. Damage protection included.</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-blue-600">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full font-bold text-lg mb-4">4</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Return & Review</h3>
              <p className="text-gray-600">Return on your rental date. Rate your experience. Move on to your next project.</p>
            </div>
          </div>

          {/* Pricing Examples */}
          <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Rental Pricing Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6">
                <p className="text-gray-600 font-semibold mb-2">Electric Drill</p>
                <p className="text-3xl font-bold text-blue-600 mb-2">£3/day</p>
                <p className="text-sm text-gray-600">Typical rental: 2-3 days = £6-9</p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-gray-600 font-semibold mb-2">Pressure Washer</p>
                <p className="text-3xl font-bold text-blue-600 mb-2">£4/day</p>
                <p className="text-sm text-gray-600">Weekend rental: 2 days = £8</p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <p className="text-gray-600 font-semibold mb-2">Ladder</p>
                <p className="text-3xl font-bold text-blue-600 mb-2">£1.50/day</p>
                <p className="text-sm text-gray-600">Day rental: 1 day = £1.50</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Owners Section */}
      <section className="bg-gradient-to-r from-emerald-50 to-cyan-50 py-16 px-4 border-y border-emerald-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">For Tool Owners</h2>
          <p className="text-gray-600 text-lg text-center mb-12 max-w-2xl mx-auto">
            Turn your unused tools into passive income. Share with neighbors, earn every rental.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Earnings Example 1 */}
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tool Owner A</h3>
              <p className="text-gray-600 text-sm mb-4">Lists 1 pressure washer (£4/day)</p>
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">5 rentals/month × £4/day × 2 days avg</p>
                <p className="text-2xl font-bold text-green-600">£40/month</p>
                <p className="text-xs text-gray-600 mt-2">Earn: £28 (70%)</p>
              </div>
              <p className="text-xs text-gray-600">Passive income from one tool!</p>
            </div>

            {/* Earnings Example 2 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border-2 border-green-500">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tool Owner B</h3>
              <p className="text-gray-600 text-sm mb-4">Lists 8 tools (mixed tools)</p>
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Average 3 rentals/month per tool × £2-4 avg</p>
                <p className="text-2xl font-bold text-green-600">£240/month</p>
                <p className="text-xs text-gray-600 mt-2">Earn: £168 (70%)</p>
              </div>
              <p className="text-xs text-gray-600">Build a serious side income!</p>
            </div>

            {/* Earnings Example 3 */}
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tool Owner C</h3>
              <p className="text-gray-600 text-sm mb-4">Lists 20 tools (diverse fleet)</p>
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Average 2 rentals/month per tool × £2-3 avg</p>
                <p className="text-2xl font-bold text-green-600">£1,200/month</p>
                <p className="text-xs text-gray-600 mt-2">Earn: £840 (70%)</p>
              </div>
              <p className="text-xs text-gray-600">Real business-level income!</p>
            </div>
          </div>

          {/* Owner Benefits */}
          <div className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-green-600">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">What Owners Get</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ownerInfo.features.map((feature) => (
                <div key={feature} className="flex items-start">
                  <span className="text-green-600 font-bold mr-3 text-lg">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Your Stats (if logged in) */}
          {session && !loadingStats && ownerStats.toolsCount > 0 && (
            <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 border-2 border-green-600">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Owner Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">Tools Listed</p>
                  <p className="text-3xl font-bold text-green-600">{ownerStats.toolsCount}</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">Potential Monthly Earnings</p>
                  <p className="text-3xl font-bold text-green-600">£{(ownerStats.toolsCount * 40).toLocaleString()}</p>
                  <p className="text-xs text-gray-600 mt-2">(assuming average rentals)</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">Your Earnings (This Month)</p>
                  <p className="text-3xl font-bold text-green-600">£{ownerStats.monthlyEarnings}</p>
                  <p className="text-xs text-gray-600 mt-2">Payouts every 30 days</p>
                </div>
              </div>
              <Link href="/owner-dashboard" className="block mt-6 text-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
                View Full Owner Dashboard →
              </Link>
            </div>
          )}

          {session && !loadingStats && ownerStats.toolsCount === 0 && (
            <div className="mt-12 bg-blue-50 rounded-lg p-8 border-2 border-blue-600 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Earn?</h3>
              <p className="text-gray-700 mb-6">You don't have any tools listed yet. Start by adding your first tool to your catalog.</p>
              <Link href="/tools/add" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                List Your First Tool →
              </Link>
            </div>
          )}

          {!session && (
            <div className="mt-12 bg-blue-50 rounded-lg p-8 border-2 border-blue-600 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Start Earning Today</h3>
              <p className="text-gray-700 mb-6">Sign up free and start listing tools. Get paid for every rental!</p>
              <Link href="/signup" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                Sign Up & List Tools →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Damage Protection */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Damage Protection</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-gray-700 mb-4">Every rental includes damage protection. If something breaks:</p>
            <ol className="space-y-3 text-gray-700 ml-6 list-decimal">
              <li>Report damage during return</li>
              <li>Borrower has 48 hours to respond</li>
              <li>We review evidence and make a fair determination</li>
              <li>If confirmed, borrower pays the repair/replacement cost</li>
              <li>Owner is reimbursed within 48 hours</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">For Borrowers</p>
              <p className="text-sm text-gray-600">Small fee per rental covers damage protection. Limits your liability for honest accidents.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">For Owners</p>
              <p className="text-sm text-gray-600">Get reimbursed for legitimate damage claims. We handle verification—no disputes.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">Fair & Transparent</p>
              <p className="text-sm text-gray-600">Both sides submit evidence. We're unbiased. Normal wear doesn't count as damage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16 px-4 border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What is ToolUnity?</h3>
              <p className="text-gray-600">ToolUnity is a peer-to-peer tool rental marketplace. Borrow tools from your neighbors instead of buying expensive equipment. Share your tools and earn money. It's that simple.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No subscription required?</h3>
              <p className="text-gray-600">Right! You just pay per rental. Need a drill for one day? Rent it for £3. No membership, no monthly commitment. You only pay when you borrow.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How much can I earn as an owner?</h3>
              <p className="text-gray-600">It depends on how many tools you list and rental demand. Most owners list between 1-5 tools and earn £20-100+ per month. Some list 10+ tools and earn £500/month+. You set the daily rental price and keep 70%.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my tool protected from damage?</h3>
              <p className="text-gray-600">Every rental includes damage protection. If something breaks, we investigate and handle the claim. Normal wear and tear doesn't count. You're reimbursed within 48 hours if damage is confirmed.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I get paid as an owner?</h3>
              <p className="text-gray-600">We pay out directly to your bank account monthly. It's automatic—no invoices, no paperwork. Just list tools, get rented, earn. We keep 30% (to cover protection, platform costs, and payment processing).</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel a borrow request as an owner?</h3>
              <p className="text-gray-600">You can decline a request before confirming it. Once confirmed, only cancel if absolutely necessary—and the borrower won't be charged. Reliability matters for your reputation.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I need the tool during a rental?</h3>
              <p className="text-gray-600">You choose your available dates when listing. Only open dates for rental. If you need it back, adjust your calendar before anyone books it.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How does ToolUnity protect me?</h3>
              <p className="text-gray-600">We verify user identities, manage payments securely through Stripe, investigate damage claims, and mediate disputes. Your location and personal details are kept private until you agree to a rental.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 text-lg mb-8">Browse tools to borrow, or list your own tools to earn. Choose your path.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tools" className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-lg">
              Browse Tools
            </Link>
            <Link href="/signup" className="px-8 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 font-bold text-lg border-2 border-white">
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
