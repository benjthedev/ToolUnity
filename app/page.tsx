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
      setWaitlistError('Something went wrong. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100">
      {/* Hero Section with Rustic Gradient */}
      <section className="bg-gradient-to-r from-amber-700 via-orange-700 to-red-800 text-white py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-serif">
            Rent Tools,<br />Save Money
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto opacity-95">
            Why buy expensive tools you'll only use once? Rent from your local community instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loading && !session ? (
              <>
                <Link
                  href="/signup"
                  className="bg-amber-100 text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-amber-200 transition inline-block"
                >
                  Get Started Free →
                </Link>
                <Link
                  href="/tools"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition inline-block"
                >
                  Browse Tools
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/tools"
                  className="bg-amber-100 text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-amber-200 transition inline-block"
                >
                  Browse Tools →
                </Link>
                <Link
                  href="/dashboard"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition inline-block"
                >
                  Go to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Postcode Availability Checker */}
      <section className="bg-gradient-to-b from-yellow-50 to-amber-50 py-16 px-4 border-b-4 border-amber-800">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">Is ToolUnity Available Near You?</h2>
            <p className="text-amber-800">We're rolling out to different areas at different times. Check if your postcode is eligible.</p>
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
              className="flex-1 px-4 py-3 border-2 border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-amber-900 placeholder-amber-600 bg-white"
            />
            <button
              type="submit"
              disabled={!postcode || postcodeStatus === 'checking'}
              className="bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {postcodeStatus === 'checking' ? 'Checking...' : 'Check'}
            </button>
          </form>

          {postcodeStatus === 'available' && (
            <div className="bg-green-900 border-2 border-green-700 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-green-100 mb-3">✨ Great News!</p>
              <p className="text-green-100 mb-4">
                ToolUnity is available in your area. Join now and start renting or listing tools.
              </p>
              {!session ? (
                <div className="flex gap-3 justify-center">
                  <Link
                    href="/signup"
                    className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/tools"
                    className="border-2 border-green-300 text-green-100 px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition"
                  >
                    Browse Tools
                  </Link>
                </div>
              ) : (
                <Link
                  href="/tools"
                  className="inline-block bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition"
                >
                  Start Browsing →
                </Link>
              )}
            </div>
          )}

          {postcodeStatus === 'unavailable' && (
            <div className="bg-amber-900 border-2 border-amber-700 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-amber-100 mb-3">Coming Soon</p>
              <p className="text-amber-100 mb-4">
                ToolUnity isn't available in your area yet, but we're expanding soon! Enter your email to be notified when we launch in your postcode.
              </p>
              {waitlistMessage && (
                <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded-lg mb-4 text-sm">
                  {waitlistMessage}
                </div>
              )}
              {waitlistError && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-4 text-sm">
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
                    className="flex-1 px-4 py-2 border-2 border-amber-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-amber-900 placeholder-amber-600 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-800 transition disabled:bg-amber-500 disabled:cursor-not-allowed"
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
      <section className="bg-gradient-to-b from-amber-50 to-yellow-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">Protected Every Step</h2>
            <p className="text-amber-800">Your rental experience is backed by clear liability terms and community trust</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Join */}
            <div className="bg-amber-50 rounded-lg border-2 border-amber-700 p-8 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-700 text-white rounded-full font-bold mb-6">1</div>
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Get Started</h3>
              <p className="text-amber-800 text-sm mb-3">
                Create your account and browse tools available in your area right away.
              </p>
            </div>

            {/* Step 2: Borrow */}
            <div className="bg-amber-50 rounded-lg border-2 border-amber-700 p-8 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-700 text-white rounded-full font-bold mb-6">2</div>
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Rent with Confidence</h3>
              <p className="text-amber-800 text-sm mb-3">
                Find a tool, pay the daily rate, and pick it up. Simple per-day pricing with no hidden fees.
              </p>
            </div>

            {/* Step 3: Return */}
            <div className="bg-amber-50 rounded-lg border-2 border-amber-700 p-8 shadow-md hover:shadow-lg transition">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-700 text-white rounded-full font-bold mb-6">3</div>
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Return & Move On</h3>
              <p className="text-amber-800 text-sm mb-3">
                Return the tool, and you're done. If there's damage, report it and our team will investigate.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-amber-800 mb-4">
              <strong>Both renters and owners are protected.</strong> Learn more about our trust system on our{' '}
              <Link href="/how-it-works" className="text-amber-700 hover:text-amber-900 font-semibold">
                How It Works
              </Link>
              {' '}page.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-yellow-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-amber-900 mb-2 font-serif">How It Works</h2>
            <p className="text-amber-800">Three simple steps to rent tools in your community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg border-2 border-amber-700">
              <div className="text-4xl mb-4">🔍</div>
              <h4 className="text-xl font-semibold mb-4 text-amber-900">Browse Local Tools</h4>
              <p className="text-amber-800">Search for tools available in your postcode. Filter by category, location, and what you need.</p>
            </div>
            <div className="bg-white p-8 rounded-lg border-2 border-amber-700">
              <div className="text-4xl mb-4">📋</div>
              <h4 className="text-xl font-semibold mb-4 text-amber-900">Request & Pay</h4>
              <p className="text-amber-800">Submit a rental request with your preferred dates. Pay securely through the platform.</p>
            </div>
            <div className="bg-white p-8 rounded-lg border-2 border-amber-700">
              <div className="text-4xl mb-4">✅</div>
              <h4 className="text-xl font-semibold mb-4 text-amber-900">Rent & Return</h4>
              <p className="text-amber-800">Pick up the tool, use it, and return it on time. Build trust with your neighbours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Owner Incentive Section */}
      <section className="bg-gradient-to-r from-amber-900 to-orange-900 border-t-4 border-amber-700 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-3xl font-bold text-amber-50 mb-3 font-serif">Earn Money From Your Tools</h2>
            <p className="text-xl text-amber-100 max-w-2xl mx-auto">
              Turn your idle tools into income. You keep 80% of every rental—we handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-yellow-50 rounded-lg p-8 border-2 border-amber-700 shadow-md">
              <h3 className="text-xl font-bold text-amber-900 mb-4">What You Get</h3>
              <ul className="space-y-3 text-amber-900">
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">✓</span>
                  <span>Keep 80% of every rental</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">✓</span>
                  <span>Set your own daily rates and earn from idle tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">✓</span>
                  <span>Approve or decline any request</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">✓</span>
                  <span>No listing fees—pay nothing until you earn</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-lg p-8 border-2 border-amber-700 shadow-md">
              <h3 className="text-xl font-bold text-amber-900 mb-4">How It Works</h3>
              <ol className="space-y-3 text-amber-900">
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">1</span>
                  <span>List your tool with photos and daily rate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">2</span>
                  <span>Renters find and request your tool</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">3</span>
                  <span>Approve the request and arrange pickup</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-700 font-bold text-lg">💵</span>
                  <span><strong>Get paid</strong> — 80% goes directly to you</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-amber-100 mb-4">

            </p>
            <Link
              href="/how-it-works"
              className="inline-block bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-800 transition"
            >
              Learn More About Listing Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-green-900 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-green-50 mb-12 font-serif">Why People Love ToolUnity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-2xl font-semibold text-yellow-400 mb-4">💰 Save Hundreds</h4>
            <p className="text-green-100">
              A power drill costs £50-200 new. Most homeowners use them once a year. Rent one instead.
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-green-300 mb-4">🌍 Help the Planet</h4>
            <p className="text-green-100 mb-4">
              Reduce waste and overproduction. Every tool rented is one less tool manufactured.
            </p>
            <p className="text-green-100">
              Join thousands of people choosing sustainable consumption over buying.
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-amber-300 mb-4">👥 Build Community</h4>
            <p className="text-green-100 mb-4">
              Meet neighbours with shared interests. Trust grows through sharing and renting.
            </p>
            <p className="text-green-100">
              Help each other complete projects. Make friends while making a difference.
            </p>
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-orange-300 mb-4">🤝 Trust & Safety</h4>
            <p className="text-green-100 mb-4">
              All members verify their email. You choose who rents your tools and can decline any request.
            </p>
            <p className="text-green-100">
              Owners are fully protected—renters pay for any damage up to the tool's value. You never lose money.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-amber-800 to-orange-800 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-serif">Ready to Join?</h2>
          <p className="text-lg mb-8 opacity-95">It's free to sign up. Pay only when you rent a tool.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools"
              className="bg-yellow-100 text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-200 transition inline-block"
            >
              Browse Tools
            </Link>
            <Link
              href="/signup"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-900 transition inline-block"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
