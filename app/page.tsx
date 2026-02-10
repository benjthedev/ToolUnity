'use client';

import Link from 'next/link';
import { useAuth } from './providers';
import { useState } from 'react';
import { Check, Search, FileText, CheckCircle, Zap, Users, Shield, Leaf, TrendingUp, Lock, ChevronRight, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      {/* Hero Section - Modern and Distinctive */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-blue-800 text-white py-24 px-4 min-h-screen flex items-center">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 text-sm font-semibold">Welcome to ToolUnity</span>
              </div>
              <h1 className="text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Rent Tools,<br />Save Money
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-xl leading-relaxed">
                Why buy expensive tools you'll only use once? Rent from your local community instead. Access the tools you need, when you need them.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!loading && !session ? (
                  <>
                    <Link
                      href="/signup"
                      className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                    >
                      Get Started Free <ChevronRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/tools"
                      className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-900 transition transform hover:scale-105"
                    >
                      Browse Tools
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/tools"
                      className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                    >
                      Browse Tools <ChevronRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/dashboard"
                      className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-900 transition transform hover:scale-105"
                    >
                      Go to Dashboard
                    </Link>
                  </>
                )}
              </div>
              
              <div className="mt-12 flex gap-8">
                <div>
                  <p className="text-3xl font-bold">1000+</p>
                  <p className="text-blue-200 text-sm">Tools Available</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">500+</p>
                  <p className="text-blue-200 text-sm">Community Members</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">£50K+</p>
                  <p className="text-blue-200 text-sm">Saved by Users</p>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl transform rotate-6 opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300 to-blue-500 rounded-2xl shadow-2xl flex items-center justify-center">
                  <Zap className="w-32 h-32 text-white opacity-80" />
                </div>
              </div>
            </div>
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

      {/* Timeline - Protected Every Step */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Protected Every Step</h2>
            <p className="text-xl text-gray-600">Your rental experience is backed by clear liability terms and community trust</p>
          </div>
          
          <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
            
            <div className="space-y-12">
              {/* Step 1 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 md:pr-12 order-2 md:order-1">
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Started</h3>
                      <p className="text-gray-600">Create your account and browse tools available in your area right away. Verify your email to join our trusted community.</p>
                    </div>
                  </div>
                  <div className="flex justify-center md:w-auto order-1 md:order-2 mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white relative z-10">
                      <Lock className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 md:pl-12 order-1">
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Rent with Confidence</h3>
                      <p className="text-gray-600">Find a tool, pay the daily rate, and pick it up. A refundable security deposit (20% of tool value) protects both you and the owner.</p>
                    </div>
                  </div>
                  <div className="flex justify-center md:w-auto mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white relative z-10">
                      <Shield className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative">
                <div className="md:flex items-center">
                  <div className="md:w-1/2 md:pr-12 order-2 md:order-1">
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Return & Move On</h3>
                      <p className="text-gray-600">Return the tool in the same condition. If there's no damage, your deposit is automatically refunded within 7 days. Simple and transparent.</p>
                    </div>
                  </div>
                  <div className="flex justify-center md:w-auto mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white relative z-10">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-gray-700 mb-6 text-lg">
              <strong>Both renters and owners are protected.</strong> Learn more about our trust system on our{' '}
              <Link href="/how-it-works" className="text-blue-600 hover:text-blue-700 font-semibold underline">
                How It Works
              </Link>
              {' '}page.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works in 3 Simple Steps</h2>
            <p className="text-xl text-gray-600">Get access to the tools you need, when you need them</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-xl mb-6 mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-center mb-4 text-gray-900">Browse Local Tools</h4>
              <p className="text-gray-700 text-center">Search for tools available in your postcode. Filter by category, price, and what you need. Read reviews from the community.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-8 rounded-xl border border-purple-200">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-xl mb-6 mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-center mb-4 text-gray-900">Request & Pay</h4>
              <p className="text-gray-700 text-center">Submit a rental request with your preferred dates. Pay securely through Stripe. A small security deposit protects both parties.</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-8 rounded-xl border border-emerald-200">
              <div className="flex items-center justify-center w-16 h-16 bg-emerald-600 text-white rounded-xl mb-6 mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-center mb-4 text-gray-900">Rent & Return</h4>
              <p className="text-gray-700 text-center">Pick up the tool, use it for your project, and return it on time. Build trust with your neighbours and unlock more rentals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Owner Incentive Section - Redesigned */}
      <section className="bg-gradient-to-br from-emerald-50 via-emerald-50 to-cyan-50 border-t-4 border-emerald-500 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center w-16 h-16 bg-emerald-600 text-white rounded-xl mb-6 mx-auto">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Earn Money From Your Tools</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Turn your idle tools into passive income. You keep 80% of every rental—we handle the rest. List your tools for free, get paid when they're rented.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 border border-emerald-200 shadow-sm hover:shadow-lg transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Check className="w-6 h-6 text-emerald-600" />
                What You Get
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Keep 80% of every rental—no commissions per rental</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Set your own daily rates and earn from idle tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Full control—approve or decline any request</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">No listing fees—pay nothing until you earn</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700">Owner protection—security deposits cover damage claims</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 border border-emerald-200 shadow-sm hover:shadow-lg transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-600" />
                How It Works
              </h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full font-bold flex-shrink-0 text-sm">1</div>
                  <span className="text-gray-700 pt-0.5">List your tool with photos, description, and daily rate</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full font-bold flex-shrink-0 text-sm">2</div>
                  <span className="text-gray-700 pt-0.5">Renters find and request your tool from their area</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full font-bold flex-shrink-0 text-sm">3</div>
                  <span className="text-gray-700 pt-0.5">Approve the request and arrange pickup with them</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full font-bold flex-shrink-0 text-sm">💵</div>
                  <span className="text-gray-700 pt-0.5"><strong>Get paid</strong> — 80% is transferred to your bank account</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/how-it-works"
              className="inline-block bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition transform hover:scale-105"
            >
              Learn More About Listing Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Why Section - New Card Design */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why People Love ToolUnity</h2>
            <p className="text-xl text-gray-600">It's more than renting—it's about building a smarter community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Save Money */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-xl mb-6">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Save Hundreds</h3>
              <p className="text-gray-600 leading-relaxed">
                A power drill costs £50-200 new, but most homeowners use them once a year. Rent one instead and save 80% compared to buying. A ladder, sander, or pressure washer? Same deal.
              </p>
            </div>
            
            {/* Planet */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-6">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Help the Planet</h3>
              <p className="text-gray-600 leading-relaxed">
                Reduce waste and overproduction. Every tool rented is one less tool manufactured. Join thousands choosing sustainable consumption over buying.
              </p>
            </div>
            
            {/* Community */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Build Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Meet neighbours with shared interests. Trust grows through sharing and renting. Help each other complete projects and make friends while making a difference.
              </p>
            </div>
            
            {/* Trust & Safety */}
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-6">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Trust & Safety</h3>
              <p className="text-gray-600 leading-relaxed">
                All members verify their email. Owners choose who rents their tools. A security deposit protects both parties. You never lose money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Modern */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-blue-800 text-white py-20 px-4">
        {/* Background animation elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Join the Community?</h2>
          <p className="text-xl text-blue-100 mb-10">It's free to sign up. Browse tools or list your own—pay only when you rent.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools"
              className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              Browse Tools <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/signup"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-900 transition transform hover:scale-105"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
