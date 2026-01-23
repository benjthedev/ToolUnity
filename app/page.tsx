'use client';

import Link from 'next/link';
import { useAuth } from './providers';
import { useState } from 'react';

export default function Home() {
  const { session, loading } = useAuth();
  const [postcode, setPostcode] = useState('');
  const [postcodeStatus, setPostcodeStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState('');
  const [waitlistError, setWaitlistError] = useState('');

  const checkPostcode = (e: React.FormEvent) => {
    e.preventDefault();
    setPostcodeStatus('checking');
    
    // Simulate a slight delay for better UX
    setTimeout(() => {
      const normalizedPostcode = postcode.toUpperCase().trim();
      const isAvailable = normalizedPostcode.startsWith('NR');
      setPostcodeStatus(isAvailable ? 'available' : 'unavailable');
    }, 300);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistSubmitting(true);
    setWaitlistMessage('');
    setWaitlistError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: waitlistEmail,
          postcode: postcode.toUpperCase().trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setWaitlistError(data.error || 'Failed to join waitlist');
        return;
      }

      setWaitlistMessage(data.message);
      setWaitlistEmail('');
    } catch (error) {
      console.error('Waitlist error:', error);
      setWaitlistError('Something went wrong. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section with Purple Gradient */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Borrow Tools,<br />Save Money
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-95">
            Why buy expensive tools you'll only use once? Join your local community and borrow instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loading && !session ? (
              <>
                <Link
                  href="/signup"
                  className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
                >
                  Get Started Free →
                </Link>
                <Link
                  href="/tools"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition inline-block"
                >
                  Browse Tools
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/tools"
                  className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
                >
                  Browse Tools →
                </Link>
                <Link
                  href="/dashboard"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition inline-block"
                >
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Postcode Availability Checker */}
      <section className="bg-white py-16 px-4 border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Is ToolTree Available Near You?</h2>
            <p className="text-gray-600">We're rolling out to different areas at different times. Check if your postcode is eligible.</p>
          </div>
          
          <form onSubmit={checkPostcode} className="flex gap-2 mb-6">
            <input
              type="text"
              value={postcode}
              onChange={(e) => {
                setPostcode(e.target.value);
                setPostcodeStatus('idle');
              }}
              placeholder="Enter your postcode (e.g., NR1 3NG)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
            />
            <button
              type="submit"
              disabled={!postcode || postcodeStatus === 'checking'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {postcodeStatus === 'checking' ? 'Checking...' : 'Check'}
            </button>
          </form>

          {postcodeStatus === 'available' && (
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-green-900 mb-3">✨ Great News!</p>
              <p className="text-green-800 mb-4">
                ToolTree is available in your area. Join now and start borrowing or listing tools.
              </p>
              {!session ? (
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/signup"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/tools"
                    className="border-2 border-green-600 text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
                  >
                    Browse Tools
                  </Link>
                </div>
              ) : (
                <Link
                  href="/tools"
                  className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Start Browsing →
                </Link>
              )}
            </div>
          )}

          {postcodeStatus === 'unavailable' && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-amber-900 mb-3">Coming Soon</p>
              <p className="text-amber-800 mb-4">
                ToolTree isn't available in your area yet, but we're expanding soon! Enter your email to be notified when we launch in your postcode.
              </p>
              {waitlistMessage && (
                <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {waitlistMessage}
                </div>
              )}
              {waitlistError && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {waitlistError}
                </div>
              )}
              {!waitlistMessage && (
                <form onSubmit={handleWaitlistSubmit} className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-700 transition disabled:bg-amber-400 disabled:cursor-not-allowed"
                  >
                    {waitlistSubmitting ? 'Adding...' : 'Notify Me'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3-Step Protection Explainer */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Protected Every Step</h2>
            <p className="text-gray-600">Your borrowing experience is backed by damage coverage and community trust</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Join */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-6">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Started</h3>
              <p className="text-gray-700 text-sm mb-3">
                Create your account and browse tools available in your area right away.
              </p>
              <p className="text-xs text-blue-600 font-semibold">✓ Quick and easy signup</p>
            </div>

            {/* Step 2: Borrow */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-6">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Borrow with Confidence</h3>
              <p className="text-gray-700 text-sm mb-3">
                Request a tool, meet the owner, and borrow it. If any damage happens, it's covered up to your protection tier (£100–£300).
              </p>
              <p className="text-xs text-blue-600 font-semibold">✓ No damage surprises</p>
            </div>

            {/* Step 3: Return */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-6">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Return & Move On</h3>
              <p className="text-gray-700 text-sm mb-3">
                Return the tool, and you're done. If there's damage, our team settles claims within 48 hours.
              </p>
              <p className="text-xs text-blue-600 font-semibold">✓ Fast claim resolution</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-700 mb-4">
              <strong>Both borrowers and owners are protected.</strong> Learn more about our trust system on our{' '}
              <Link href="/safety" className="text-blue-600 hover:text-blue-700 font-semibold">
                Safety & Trust
              </Link>
              {' '}page.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
            <p className="text-gray-600">Three simple steps to borrow tools in your community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900">Browse Local Tools</h4>
              <p className="text-gray-600">Search for tools available in your postcode. Filter by category, location, and what you need.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">📋</div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900">Request & Wait</h4>
              <p className="text-gray-600">Submit a borrow request with your preferred dates. The owner reviews and approves requests.</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">✅</div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900">Borrow & Return</h4>
              <p className="text-gray-600">Pick up the tool, use it, and return it on time. Build trust with your neighbours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Owner Incentive Section */}
      <section className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-t-4 border-emerald-400 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">🎁</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Share 3 Tools, Get Standard for Free</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Tool owners who list 3 or more active tools automatically receive our Standard plan benefits at no cost.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 border border-emerald-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What You Get</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">✓</span>
                  <span>Borrow 2 tools at once</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">✓</span>
                  <span>Borrow tools up to £300 value</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">✓</span>
                  <span>Keep tools for 7 days</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">✓</span>
                  <span>£0 monthly charge</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 border border-emerald-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">1</span>
                  <span>List your first tool</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">2</span>
                  <span>List your second tool</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">3</span>
                  <span>List your third tool</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg">✨</span>
                  <span><strong>Automatically upgraded</strong> — no action needed</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              This is permanent as long as you keep 3+ tools active. Relist if you drop below 3.
            </p>
            <Link
              href="/for-owners"
              className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              Learn More About Listing Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why People Love ToolTree</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-2xl font-semibold text-green-600 mb-4">💰 Save Hundreds</h4>
            <p className="text-gray-600 mb-4">
              A power drill costs £50-200 new. Most homeowners use them once a year. Borrow instead for free or for a few pounds on premium plans.
            </p>
            <p className="text-gray-600">
              Premium tiers cost just £10-£25/month and unlock higher borrowing limits. No per-use fees.
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-blue-600 mb-4">🌍 Help the Planet</h4>
            <p className="text-gray-600 mb-4">
              Reduce waste and overproduction. Every tool borrowed is one less tool manufactured.
            </p>
            <p className="text-gray-600">
              Join thousands of people choosing sustainable consumption over buying.
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-purple-600 mb-4">👥 Build Community</h4>
            <p className="text-gray-600 mb-4">
              Meet neighbours with shared interests. Trust grows through lending and borrowing.
            </p>
            <p className="text-gray-600">
              Help each other complete projects. Make friends while making a difference.
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-orange-600 mb-4">🤝 Trust & Safety</h4>
            <p className="text-gray-600 mb-4">
              Every member is verified and reviewed. If a tool is damaged during a borrow, we guarantee the owner will be compensated in full.
            </p>
            <p className="text-gray-600">
              Both borrowers and lenders can have complete peace of mind with our comprehensive damage protection guarantee.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-lg mb-8 opacity-95">It's free to use. Upgrade if you want more borrowing power.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block"
            >
              Browse Tools
            </Link>
            <Link
              href="/signup"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition inline-block"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
