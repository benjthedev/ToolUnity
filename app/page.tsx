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
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero Section - Enhanced with Graphics */}
      <section className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white py-24 px-4 relative overflow-hidden">
        {/* SVG Tool Graphics Background */}
        <div className="absolute top-10 right-10 opacity-10 w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="25" y="30" width="50" height="10" fill="white" rx="2"/>
            <circle cx="35" cy="50" r="15" fill="none" stroke="white" strokeWidth="3"/>
            <path d="M 65 35 L 75 50 L 65 65 Q 55 60 55 50 Q 55 40 65 35" fill="white"/>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
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
                  className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition inline-block shadow-lg"
                >
                  Get Started Free →
                </Link>
                <Link
                  href="/tools"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition inline-block"
                >
                  Browse Tools
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/tools"
                  className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition inline-block shadow-lg"
                >
                  Browse Tools →
                </Link>
                <Link
                  href="/dashboard"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition inline-block"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Is ToolUnity Available Near You?</h2>
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
                ToolUnity is available in your area. Join now and start renting or listing tools.
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
                ToolUnity isn't available in your area yet, but we're expanding soon! Enter your email to be notified when we launch in your postcode.
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
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Protected Every Step</h2>
            <p className="text-gray-600">Your rental experience is backed by clear liability terms and community trust</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Join */}
            <div className="bg-white rounded-lg border-2 border-teal-200 p-8 shadow-sm hover:shadow-md transition hover:border-teal-400">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-full font-bold mb-6 text-lg">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Started</h3>
              <p className="text-gray-700 text-sm mb-3">
                Create your account and browse tools available in your area right away.
              </p>
              {/* Small SVG icon */}
              <div className="w-16 h-16 mx-auto mt-4">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="35" r="15" fill="#14B8A6" opacity="0.2"/>
                  <rect x="35" y="55" width="30" height="35" fill="#14B8A6" opacity="0.2" rx="2"/>
                </svg>
              </div>
            </div>

            {/* Step 2: Borrow */}
            <div className="bg-white rounded-lg border-2 border-orange-200 p-8 shadow-sm hover:shadow-md transition hover:border-orange-400">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-full font-bold mb-6 text-lg">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Rent with Confidence</h3>
              <p className="text-gray-700 text-sm mb-3">
                Find a tool, pay the daily rate, and pick it up. Simple per-day pricing with no hidden fees.
              </p>
              {/* Wrench SVG */}
              <div className="w-16 h-16 mx-auto mt-4">
                <svg viewBox="0 0 100 100">
                  <path d="M 30 70 L 60 40 M 60 40 L 75 25 Q 85 15 95 25 Q 85 35 75 25" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="30" cy="70" r="8" fill="#F97316" opacity="0.3"/>
                </svg>
              </div>
            </div>

            {/* Step 3: Return */}
            <div className="bg-white rounded-lg border-2 border-emerald-200 p-8 shadow-sm hover:shadow-md transition hover:border-emerald-400">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full font-bold mb-6 text-lg">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Return & Move On</h3>
              <p className="text-gray-700 text-sm mb-3">
                Return the tool, and you're done. If there's damage, report it and our team will investigate.
              </p>
              {/* Checkmark SVG */}
              <div className="w-16 h-16 mx-auto mt-4">
                <svg viewBox="0 0 100 100">
                  <path d="M 30 50 L 45 65 L 70 35" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-700 mb-4">
              <strong>Both renters and owners are protected.</strong> Learn more about our trust system on our{' '}
              <Link href="/how-it-works" className="text-orange-600 hover:text-orange-700 font-semibold">
                How It Works
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
            <p className="text-gray-600">Three simple steps to rent tools in your community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-lg border border-teal-200 hover:border-teal-400 transition">
              {/* Magnifying glass SVG */}
              <div className="text-4xl mb-4 flex justify-center">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <circle cx="40" cy="40" r="25" fill="none" stroke="#0D9488" strokeWidth="3"/>
                  <path d="M 60 60 L 80 80" stroke="#0D9488" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900 text-center">Browse Local Tools</h4>
              <p className="text-gray-600 text-center">Search for tools available in your postcode. Filter by category, location, and what you need.</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-lg border border-orange-200 hover:border-orange-400 transition">
              {/* Clipboard SVG */}
              <div className="text-4xl mb-4 flex justify-center">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <rect x="25" y="20" width="50" height="60" fill="none" stroke="#F97316" strokeWidth="3" rx="2"/>
                  <line x1="35" y1="35" x2="65" y2="35" stroke="#F97316" strokeWidth="2"/>
                  <line x1="35" y1="50" x2="65" y2="50" stroke="#F97316" strokeWidth="2"/>
                  <line x1="35" y1="65" x2="55" y2="65" stroke="#F97316" strokeWidth="2"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900 text-center">Request & Pay</h4>
              <p className="text-gray-600 text-center">Submit a rental request with your preferred dates. Pay securely through the platform.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-lg border border-emerald-200 hover:border-emerald-400 transition">
              {/* Checkmark SVG */}
              <div className="text-4xl mb-4 flex justify-center">
                <svg className="w-12 h-12" viewBox="0 0 100 100">
                  <path d="M 30 50 L 45 65 L 70 35" fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900 text-center">Rent & Return</h4>
              <p className="text-gray-600 text-center">Pick up the tool, use it, and return it on time. Build trust with your neighbours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Owner Incentive Section */}
      <section className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t-4 border-emerald-500 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-5xl mb-4 flex justify-center">
              <svg className="w-16 h-16" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.2"/>
                <path d="M 50 30 L 55 45 L 70 45 L 58 55 L 63 70 L 50 62 L 37 70 L 42 55 L 30 45 L 45 45 Z" fill="#10B981"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Earn Money From Your Tools</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Turn your idle tools into income. You keep 80% of every rental—we handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 border-2 border-emerald-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                <h3 className="text-xl font-bold text-gray-900">What You Get</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg mt-1">✓</span>
                  <span>Keep 80% of every rental</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg mt-1">✓</span>
                  <span>Set your own daily rates and earn from idle tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg mt-1">✓</span>
                  <span>Approve or decline any request</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold text-lg mt-1">✓</span>
                  <span>No listing fees—pay nothing until you earn</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 border-2 border-teal-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold">→</div>
                <h3 className="text-xl font-bold text-gray-900">How It Works</h3>
              </div>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold text-lg min-w-fit">1</span>
                  <span>List your tool with photos and daily rate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold text-lg min-w-fit">2</span>
                  <span>Renters find and request your tool</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold text-lg min-w-fit">3</span>
                  <span>Approve the request and arrange pickup</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-500 font-bold text-lg min-w-fit">💵</span>
                  <span><strong>Get paid</strong> — 80% goes directly to you</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">

            </p>
            <Link
              href="/how-it-works"
              className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition shadow-md hover:shadow-lg"
            >
              Learn More About Listing Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why People Love ToolUnity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white rounded-lg p-8 border-2 border-emerald-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 100 100">
                  <path d="M 20 70 L 50 30 L 80 60" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="50" cy="30" r="3" fill="#10B981"/>
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-emerald-600">Save Hundreds</h4>
            </div>
            <p className="text-gray-600">
              A power drill costs £50-200 new. Most homeowners use them once a year. Rent one instead.
            </p>
          </div>
          <div className="bg-white rounded-lg p-8 border-2 border-teal-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 100 100">
                  <path d="M 50 30 L 70 50 L 50 70 L 30 50 Z" fill="#14B8A6" opacity="0.3"/>
                  <circle cx="50" cy="50" r="8" fill="#14B8A6"/>
                  <path d="M 50 20 L 60 40 M 50 20 L 40 40" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-teal-600">Help the Planet</h4>
            </div>
            <p className="text-gray-600 mb-4">
              Reduce waste and overproduction. Every tool rented is one less tool manufactured.
            </p>
            <p className="text-gray-600">
              Join thousands of people choosing sustainable consumption over buying.
            </p>
          </div>
          <div className="bg-white rounded-lg p-8 border-2 border-orange-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 100 100">
                  <circle cx="30" cy="40" r="12" fill="none" stroke="#F97316" strokeWidth="2"/>
                  <circle cx="70" cy="40" r="12" fill="none" stroke="#F97316" strokeWidth="2"/>
                  <circle cx="50" cy="70" r="12" fill="none" stroke="#F97316" strokeWidth="2"/>
                  <line x1="38" y1="44" x2="62" y2="44" stroke="#F97316" strokeWidth="1.5"/>
                  <line x1="62" y1="44" x2="58" y2="60" stroke="#F97316" strokeWidth="1.5"/>
                  <line x1="38" y1="44" x2="58" y2="60" stroke="#F97316" strokeWidth="1.5"/>
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-orange-600">Build Community</h4>
            </div>
            <p className="text-gray-600 mb-4">
              Meet neighbours with shared interests. Trust grows through sharing and renting.
            </p>
            <p className="text-gray-600">
              Help each other complete projects. Make friends while making a difference.
            </p>
          </div>
          <div className="bg-white rounded-lg p-8 border-2 border-blue-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 100 100">
                  <path d="M 50 20 L 60 40 L 80 45 L 65 60 L 70 80 L 50 70 L 30 80 L 35 60 L 20 45 L 40 40 Z" fill="#3B82F6" opacity="0.3"/>
                  <path d="M 50 20 L 60 40 L 80 45 L 65 60 L 70 80 L 50 70 L 30 80 L 35 60 L 20 45 L 40 40 Z" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="miter"/>
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-blue-600">Trust & Safety</h4>
            </div>
            <p className="text-gray-600 mb-4">
              All members verify their email. You choose who rents your tools and can decline any request.
            </p>
            <p className="text-gray-600">
              Owners are fully protected—renters pay for any damage up to the tool's value. You never lose money.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-lg mb-8 opacity-95">It's free to sign up. Pay only when you rent a tool.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools"
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition inline-block shadow-lg"
            >
              Browse Tools
            </Link>
            <Link
              href="/signup"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition inline-block"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
