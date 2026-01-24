'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started with ToolUnity',
    features: ['2 active borrows', 'Community access'],
    current: true,
  },
  {
    name: 'Standard',
    price: '$9.99',
    period: '/month',
    description: 'For regular tool sharers',
    features: ['10 active borrows', 'Priority support', 'Advanced filters'],
    priceId: 'price_1Sk7XZBt1LczyCVDOPofihFZ',
  },
  {
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    description: 'For power users',
    features: ['Unlimited borrows', '24/7 support', 'Insurance coverage'],
    priceId: 'price_1Sk7YbBt1LczyCVDef9jBhUV',
  },
];

export default function PricingUpgradePage() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    if (!session) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: session.user?.id,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe - using window.location for checkout
      window.location.href = `/api/checkout-redirect?sessionId=${sessionId}`;
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Upgrade Your Plan</h1>
          <p className="text-gray-600 mt-2">Unlock more features and increase your borrowing limit</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-lg overflow-hidden transition-transform ${
                plan.current ? 'ring-2 ring-green-500' : ''
              } ${!plan.current ? 'md:scale-105' : ''}`}
            >
              <div className="bg-white p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.current && (
                  <p className="text-sm text-green-600 font-semibold mb-4">Current Plan</p>
                )}
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600">{plan.period}</span>}
                </div>

                {plan.current ? (
                  <button
                    disabled
                    className="w-full bg-green-100 text-green-800 py-3 rounded-lg font-semibold mb-8"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.priceId!)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 mb-8"
                  >
                    {loading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                )}

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <span className="text-green-500 mr-3">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
