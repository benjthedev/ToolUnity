'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';

export default function HowItWorksPage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h1>
          <p className="text-xl text-gray-600">Everything you need to know about renting and listing tools on ToolUnity</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Quick Overview */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <p className="text-lg text-gray-900 leading-relaxed">
            <strong>ToolUnity connects tool owners with people who need them.</strong> Owners list tools and set their own prices. Renters browse, request, and pay securely. Owners approve requests and coordinate pickup. Everyone wins.
          </p>
        </section>

        {/* ===== FOR RENTERS ===== */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="text-4xl">🔧</div>
            <h2 className="text-3xl font-bold text-gray-900">For Renters</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Browse Tools</h3>
                <p className="text-gray-700">Find tools available in your area. See photos, condition, and daily rates.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request & Pay</h3>
                <p className="text-gray-700">Choose your rental dates and submit a request. Pay securely through Stripe. A <strong>£10 refundable security deposit</strong> is included at checkout to protect the tool owner.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pick Up & Use</h3>
                <p className="text-gray-700">Once approved, coordinate pickup with the owner. Use the tool for your project.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Return & Get Your Deposit Back</h3>
                <p className="text-gray-700">Return the tool in the same condition. The owner has 7 days to inspect it. If everything's fine, your <strong>£10 deposit is automatically refunded</strong>—no action needed.</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/tools"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Browse Tools →
            </Link>
          </div>
        </section>

        {/* ===== FOR OWNERS ===== */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="text-4xl">💰</div>
            <h2 className="text-3xl font-bold text-gray-900">For Tool Owners</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">You Control Everything</h3>
              <p className="text-gray-700 text-sm">Set your own daily rates. Approve or decline every rental request. You're in charge.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">💵</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn 80%</h3>
              <p className="text-gray-700 text-sm">Keep 80% of every rental. 20% covers payment processing (Stripe fees), website hosting, and platform operations.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deposit Protection</h3>
              <p className="text-gray-700 text-sm">Every rental includes a £10 security deposit. If a renter damages your tool, you have 7 days to report it and claim the deposit.</p>
            </div>
          </div>
          
          <div className="space-y-6">
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
                <p className="text-gray-700">Add tools with photos, descriptions, condition, and set your daily rental rate.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Approve Requests</h3>
                <p className="text-gray-700">Review rental requests. You see the renter's details and decide who rents your tools.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Get Paid</h3>
                <p className="text-gray-700">Earn 80% of every rental. We process payouts within 5 business days of each completed rental.</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            {session ? (
              <Link
                href="/tools/add"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                List Your First Tool →
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Sign Up Free →
              </Link>
            )}
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-600 mb-3">For Renters</h3>
              <p className="text-gray-700">Pay the daily rate set by the owner, plus a <strong>£10 refundable security deposit</strong>. No subscriptions, no hidden fees. Your deposit is automatically refunded 7 days after return if no damage is reported.</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-600 mb-3">For Owners</h3>
              <p className="text-gray-700">List for free. Set your own prices. Keep 80% of every rental. 20% covers payment processing (Stripe fees), website hosting, and admin.</p>
            </div>
          </div>
        </section>

        {/* ===== DAMAGE & SAFETY ===== */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Damage & Protection</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Who Pays If Something Breaks?</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <p className="text-gray-700">
                  <strong>Renters</strong> are responsible for any damage beyond normal wear and tear. A <strong>£10 security deposit</strong> is held during every rental to cover potential damage.
                </p>
                <p className="text-gray-700">
                  <strong>Owners</strong> have 7 days after the tool is returned to inspect it. If damage is found, the owner can claim the deposit. An admin reviews every claim to ensure fairness.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How the Security Deposit Works</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <ol className="space-y-3 text-gray-700">
                  <li><strong>1. Checkout</strong> — A £10 refundable deposit is added to your rental payment</li>
                  <li><strong>2. Held securely</strong> — The deposit is held while you have the tool</li>
                  <li><strong>3. Tool returned</strong> — The owner has 7 days to inspect the tool</li>
                  <li><strong>4a. No issues</strong> — Your deposit is automatically refunded after 7 days</li>
                  <li><strong>4b. Damage reported</strong> — The owner files a claim, and an admin reviews it</li>
                  <li><strong>5. Admin decision</strong> — If the claim is valid, the deposit is forfeited. If not, it's refunded to you</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What Counts as Damage?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="font-semibold text-green-900 mb-3">Normal Wear (No Charge)</p>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✓ Dirt, dust, cosmetic scuffs</li>
                    <li>✓ Normal blade dulling</li>
                    <li>✓ Battery capacity loss from use</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="font-semibold text-red-900 mb-3">Damage (Renter Pays)</p>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✗ Tool no longer functions</li>
                    <li>✗ Broken housing or safety features</li>
                    <li>✗ Water or fire damage</li>
                    <li>✗ Missing essential parts</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Dispute Resolution</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <ol className="space-y-3 text-gray-700">
                  <li><strong>1. Damage reported</strong> — Owner reports damage within 7 days of return and claims the deposit</li>
                  <li><strong>2. Admin review</strong> — A ToolUnity admin reviews the claim and any evidence</li>
                  <li><strong>3. Decision</strong> — The admin either refunds the deposit to the renter or forfeits it to compensate the owner</li>
                  <li><strong>4. Both notified</strong> — Both renter and owner receive an email with the outcome</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ===== WHAT YOU CAN LIST ===== */}
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
        </section>

        {/* ===== TRUST & SAFETY ===== */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Trust & Safety</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>✓ Verified members</strong> — All members verify their email before renting
              </li>
              <li>
                <strong>✓ Owner approval</strong> — Owners approve each rental request personally
              </li>
              <li>
                <strong>✓ Clear pricing</strong> — Daily rates set by owners, no hidden fees
              </li>
              <li>
                <strong>✓ Secure payments</strong> — All payments processed securely through Stripe
              </li>
              <li>
                <strong>✓ Refundable deposits</strong> — £10 security deposit protects owners and is auto-refunded if no damage is reported
              </li>
              <li>
                <strong>✓ Direct communication</strong> — Renters and owners coordinate directly for pickup
              </li>
              <li>
                <strong>✓ Privacy first</strong> — Your details stay private until a rental is agreed
              </li>
            </ul>
          </div>
        </section>

        {/* ===== FAQs ===== */}
        <section id="faq">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a cost to list tools?</h3>
              <p className="text-gray-700">
                No. Listing is completely free. You only pay the 20% platform fee (covering Stripe, hosting, admin) when someone rents your tool.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I set my rental price?</h3>
              <p className="text-gray-700">
                You choose the daily rate. Consider the tool's condition and demand in your area. You can adjust prices anytime.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">When do owners get paid?</h3>
              <p className="text-gray-700">
                We process payouts within 5 business days of a completed rental. Owners receive 80% of each rental.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if a tool gets damaged?</h3>
              <p className="text-gray-700">
                The owner has 7 days after return to report damage and claim the £10 security deposit. An admin reviews every claim. If the claim is valid, the deposit is forfeited to compensate the owner. If not, it's refunded to the renter.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">When do I get my deposit back?</h3>
              <p className="text-gray-700">
                Your £10 deposit is automatically refunded 7 days after the tool is returned, as long as the owner hasn't reported any damage. You'll receive an email when the refund is processed.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if a tool doesn't get returned?</h3>
              <p className="text-gray-700">
                We investigate immediately. The renter's account is reviewed, and the owner is compensated. We handle it.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I remove a tool anytime?</h3>
              <p className="text-gray-700">
                Yes. If a tool is currently rented, that rental will complete first. No penalties for removal.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my personal info shared?</h3>
              <p className="text-gray-700">
                Your details stay private until you both agree to a rental. Then you coordinate directly for pickup/dropoff.
              </p>
            </div>
          </div>
        </section>

        {/* ===== CONTACT ===== */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Still Have Questions?</h3>
          <p className="text-gray-700 mb-4">
            Contact us at{' '}
            <a href="mailto:support@toolunity.co.uk" className="text-blue-600 hover:text-blue-700 font-semibold">
              support@toolunity.co.uk
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
