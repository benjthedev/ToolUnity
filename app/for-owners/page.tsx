'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForOwnersPage() {
  const { session, loading } = useAuth();
  const [toolsCount, setToolsCount] = useState(0);
  const [loadingTools, setLoadingTools] = useState(true);

  useEffect(() => {
    if (session?.user?.id && !loading) {
      const fetchTools = async () => {
        const { data } = await supabase
          .from('tools')
          .select('id')
          .eq('owner_id', session.user!.id);
        setToolsCount(data?.length || 0);
        setLoadingTools(false);
      };
      fetchTools();
    } else if (!loading) {
      setLoadingTools(false);
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why List Tools on ToolUnity?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Earn Money</h3>
              <p className="text-gray-700">
                Keep your tools in use and earn 85% of every rental. You never lose money—renters pay for any damage.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-4xl mb-3">🔄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">You Control Everything</h3>
              <p className="text-gray-700">
                Set your own daily rates (£1-5 per day). Approve or decline every rental request. You're in charge.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-4xl mb-3">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Community</h3>
              <p className="text-gray-700">
                Be part of a sharing economy that saves money and reduces waste. Help your neighbours, build relationships.
              </p>
            </div>
          </div>
        </section>

        {/* Earnings Example */}
        {!loadingTools && (
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">How Much Can You Earn?</h2>
              <p className="text-center text-gray-600 mb-8">Simple pay-per-rental model. You set the price, you get 85%.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Set Your Price</p>
                  <p className="text-3xl font-bold text-green-600 mb-4">£1-5/day</p>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>Drill, Pressure Washer, Ladder</p>
                    <p className="text-lg font-semibold text-green-600">You choose the rate</p>
                    <p className="text-xs text-gray-600">Based on tool value & demand</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border-2 border-green-500">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">YOU GET 85%</div>
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Simple Split</p>
                  <p className="text-3xl font-bold text-green-600 mb-4">85% Owner</p>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>Of every rental</p>
                    <p className="text-lg font-semibold text-green-600">No hidden fees</p>
                    <p className="text-xs text-gray-600">15% covers platform & operations</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">More Tools = More Opportunities</p>
                  <p className="text-3xl font-bold text-green-600 mb-4">Scale Up</p>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>List as many tools as you want</p>
                    <p className="text-lg font-semibold text-green-600">Build your catalog</p>
                    <p className="text-xs text-gray-600">Earnings scale with rentals</p>
                  </div>
                </div>
              </div>

              {session && !loadingTools && (
                <div className="mt-8 text-center">
                  <p className="text-gray-700 mb-4">You currently have <strong>{toolsCount}</strong> tool{toolsCount !== 1 ? 's' : ''} listed.</p>
                  <Link
                    href="/owner-dashboard"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
                  >
                    View Your Dashboard
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* How It Works */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign Up & Verify</h3>
                <p className="text-gray-700">Create your account, verify your email, and add your bank details for payouts.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">List Your Tools</h3>
                <p className="text-gray-700">Add tools with photos, descriptions, condition, and set your daily rental rate (£1-5/day). You control the price.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Approve Rental Requests</h3>
                <p className="text-gray-700">Review and approve rental requests. You decide who rents what and when—you're always in control.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Get Paid</h3>
                <p className="text-gray-700">Earn 85% of every rental. We process payouts monthly straight to your bank account.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Breakdown */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-gray-600 mb-2">Renter Pays</p>
              <p className="text-3xl font-bold text-blue-600">£X/day</p>
              <p className="text-sm text-gray-600 mt-2">(You set the daily rate)</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">You Earn (85%)</p>
              <p className="text-3xl font-bold text-green-600">£X × 0.85</p>
              <p className="text-sm text-gray-600 mt-2">Per rental day</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2">Platform Fee (15%)</p>
              <p className="text-3xl font-bold text-orange-600">£X × 0.15</p>
              <p className="text-sm text-gray-600 mt-2">Operations & security</p>
            </div>
          </div>
          <p className="text-center text-gray-700 mt-6">
            No hidden fees. You set the price, renters pay per day, you get 85%. That's it.
          </p>
        </section>

        {/* What You Can List */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What You Can List</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="font-semibold text-green-900 mb-3">✓ Allowed on ToolUnity</p>
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
              <p className="font-semibold text-red-900 mb-3">✗ NOT Allowed</p>
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
            ToolUnity reserves the right to remove listings that pose safety risks or violate community guidelines.
          </p>
        </section>

        {/* Verification */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Before You List: Quick Setup</h2>
          
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">✓ Email Verification</h3>
              <p className="text-gray-700 text-sm">Confirm your email address (1 minute)</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">✓ Bank Account for Payouts</h3>
              <p className="text-gray-700 text-sm">Add your bank details (2 minutes). We'll transfer your earnings monthly.</p>
            </div>
          </div>

          <p className="text-gray-700 mt-6">
            That's it! No phone verification, no complex background checks. Just verify your email and bank account, then start earning.
          </p>
        </section>


        {/* CTA */}
        <section className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Earning?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            List your tools free. Set your own prices. Start earning 85% on every rental. No memberships, no hidden fees.
          </p>
          {session ? (
            <Link
              href="/tools/add"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Add Your First Tool
            </Link>
          ) : (
            <Link
              href="/signup"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Sign Up Free
            </Link>
          )}
        </section>

        {/* FAQ */}
        <section className="border-t border-gray-200 pt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Common Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a cost to list tools?</h3>
              <p className="text-gray-700">
                No. Listing is completely free. There are no fees or hidden charges. You only pay the platform fee (15%) when someone rents your tool.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How much should I charge per day?</h3>
              <p className="text-gray-700">
                You set the price. Consider the tool's value, condition, and demand in your area. Most tools rent between £1-5/day. You can always adjust your prices anytime.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">When do I get paid?</h3>
              <p className="text-gray-700">
                We process payouts to your bank account within 5 business days of a completed rental. You receive 85% of each rental.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I see who's renting my tools?</h3>
              <p className="text-gray-700">
                Yes. You review and approve every rental request before it happens. You see the renter's name and contact details. You're in complete control.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if a tool doesn't get returned?</h3>
              <p className="text-gray-700">
                ToolUnity investigates immediately. If a rental isn't returned, the renter is flagged, their account is reviewed, and you're compensated for the tool value. We handle it.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I remove a tool anytime?</h3>
              <p className="text-gray-700">
                Yes. If a tool is currently rented, that rental will complete first. You can also mark tools as temporarily unavailable. No penalties.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my personal info shared with renters?</h3>
              <p className="text-gray-700">
                No. Your location and personal details stay private until you both agree to a rental. Then you coordinate directly for pickup/dropoff.
              </p>
            </div>
          </div>
        </section>

        {/* Learn More */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Have Questions?</h3>
          <p className="text-gray-700 mb-4">
            Check out our <Link href="/safety" className="text-green-600 hover:text-green-700 font-semibold">Safety & FAQs page</Link> for answers to common questions.
          </p>
          <p className="text-sm text-gray-600">
            Still have questions? <Link href="/contact" className="text-green-600 hover:text-green-700 font-semibold">Contact us</Link>
          </p>
        </section>

      </div>
    </div>
  );
}
