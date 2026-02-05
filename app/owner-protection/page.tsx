export const metadata = {
  title: 'Owner Protection | ToolUnity',
  description: 'Learn how ToolUnity protects tool owners with renter accountability and fair dispute resolution.',
};

import Link from 'next/link';

export default function OwnerProtectionPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Owner Protection</h1>
          <p className="text-xl text-gray-600">
            We put you in control. Renters are liable for any damage to your tools.
          </p>
        </div>

        {/* Protection Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Protect You</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* You Approve */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-3xl font-bold text-blue-600 mb-3">You Choose</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Approve Every Rental</h3>
              <p className="text-gray-700 text-sm">
                You review and approve every rental request. Decline anyone you're not comfortable with.
              </p>
            </div>

            {/* Renter Liability */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-3xl font-bold text-blue-600 mb-3">Renter Pays</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">You Never Lose Money</h3>
              <p className="text-gray-700 text-sm">
                If a renter damages your tool, they're liable for repair or replacement up to the tool's value. You're fully protected.
              </p>
            </div>

            {/* Earn Money */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-3xl font-bold text-blue-600 mb-3">80%</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Earnings</h3>
              <p className="text-gray-700 text-sm">
                You keep 80% of every rental. 20% covers Stripe fees, hosting, and admin.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How Rentals Work</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. List Your Tool</h3>
              <p className="text-gray-700">
                Upload photos, add a description, set your daily rate. Your tool is live and searchable.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Receive Requests</h3>
              <p className="text-gray-700">
                Renters browse and request your tool. You see their profile and can approve or decline.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Arrange Pickup</h3>
              <p className="text-gray-700">
                Once approved, coordinate pickup directly with the renter. They pay upfront through the platform.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Get Paid</h3>
              <p className="text-gray-700">
                You receive 80% of the rental fee. 20% covers payment processing, hosting, and admin.
              </p>
            </div>
          </div>
        </section>

        {/* Damage Claims */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">If Damage Occurs</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <p className="text-gray-700 mb-4">
              <strong>Renters are liable</strong> for damage to your tools, capped at the tool's listed value.
            </p>
            <ol className="space-y-3 text-gray-700">
              <li><strong>1. Report damage</strong> — Submit photos when the tool is returned</li>
              <li><strong>2. We investigate</strong> — Our team reviews the claim fairly</li>
              <li><strong>3. Renter charged</strong> — If damage is confirmed, the renter pays</li>
            </ol>
          </div>
        </section>

        {/* What's NOT Covered */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What's NOT Covered</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✕</span>
              <span><strong>Normal wear:</strong> Light scratches, dust, or expected use marks are not damage.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✕</span>
              <span><strong>Pre-existing issues:</strong> Damage present before the rental is not covered.</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="mb-6">List your first tool and start earning 80% of every rental.</p>
          <Link
            href="/tools/add"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            List a Tool →
          </Link>
        </section>

        {/* Questions */}
        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions?</h2>
          <p className="text-gray-700">
            For more details on damage claims or how rentals work, visit our{' '}
            <Link href="/how-it-works" className="text-blue-600 hover:text-blue-700 font-semibold">
              How It Works
            </Link>
            {' '}page or email{' '}
            <a href="mailto:support@toolunity.co.uk" className="text-blue-600 hover:text-blue-700 font-semibold">
              support@toolunity.co.uk
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
