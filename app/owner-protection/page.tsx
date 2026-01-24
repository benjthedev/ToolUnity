export const metadata = {
  title: 'Owner Protection & Guarantee | ToolUnity',
  description: 'Learn how ToolUnity protects tool owners with damage liability coverage and fair dispute resolution.',
};

import Link from 'next/link';

export default function OwnerProtectionPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Owner Protection Guarantee</h1>
          <p className="text-xl text-gray-600">
            We protect your tools with comprehensive damage liability coverage and fair dispute resolution.
          </p>
        </div>

        {/* Protection Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Protect You</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Coverage */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-3xl font-bold text-blue-600 mb-3">100% Coverage</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Damage Liability</h3>
              <p className="text-gray-700 text-sm">
                If a borrower damages your tool, we reimburse you up to your protection tier limit (£100–£1,000).
              </p>
            </div>

            {/* Fast Payouts */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-3xl font-bold text-blue-600 mb-3">48 Hours</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Fast Payouts</h3>
              <p className="text-gray-700 text-sm">
                Approved damage claims are paid out within 48 hours. No lengthy processing or delays.
              </p>
            </div>

            {/* Easy Listing */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="text-3xl font-bold text-blue-600 mb-3">Simple</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Easy to List</h3>
              <p className="text-gray-700 text-sm">
                Upload 2-5 condition photos, add basic details, and your tools are live. Approve requests as they come in.
              </p>
            </div>
          </div>
        </section>

        {/* Coverage Tiers */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Coverage by Subscription Tier</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Liability Cap</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Max Tool Value</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Coverage Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">Free</td>
                  <td className="px-6 py-4 text-sm text-gray-700">£100</td>
                  <td className="px-6 py-4 text-sm text-gray-700">£100</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Single damage claim covered per term</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">Standard</td>
                  <td className="px-6 py-4 text-sm text-gray-700">£300</td>
                  <td className="px-6 py-4 text-sm text-gray-700">£300</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Up to 2 damage claims covered per term</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">Pro</td>
                  <td className="px-6 py-4 text-sm text-gray-700">£1,000</td>
                  <td className="px-6 py-4 text-sm text-gray-700">£1,000</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Up to 5 damage claims covered per term</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* How Claims Work */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How Damage Claims Work</h2>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Report Damage</h3>
              <p className="text-gray-700">
                Notice a tool returned damaged? Report it within 48 hours with photos showing the damage. Compare against the baseline condition photos uploaded at listing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. ToolUnity Review</h3>
              <p className="text-gray-700">
                Our team reviews your claim within 24–48 hours. We compare the damage photos to baseline condition photos and verify the damage is legitimate.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Fair Assessment</h3>
              <p className="text-gray-700">
                We assess the repair cost or replacement value. If it's within your coverage tier, we approve the claim. If it exceeds your tier, we cover up to your cap.
              </p>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Fast Payout</h3>
              <p className="text-gray-700">
                Approved claims are paid to your account within 48 hours. No disputes, no delays. You're reimbursed and can move forward.
              </p>
            </div>
          </div>
        </section>

        {/* Baseline Photos Matter */}
        <section className="mb-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Baseline Photos Matter</h2>
          <p className="text-gray-700 mb-4">
            When you list a tool, you upload 2–5 condition photos. These photos establish a <strong>baseline</strong> for what the tool looks like before any borrows. If a tool is returned damaged, we compare the returned condition to these baseline photos to determine what damage occurred during the borrow.
          </p>
          <p className="text-gray-700">
            <strong>Good baseline photos =</strong> Clear damage claims, faster approvals, and better protection for you.
          </p>
        </section>

        {/* What's NOT Covered */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What's NOT Covered</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✕</span>
              <span><strong>Wear & tear:</strong> Normal use, slight dents, or paint loss is expected wear. Not covered.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✕</span>
              <span><strong>Maintenance issues:</strong> If a tool wasn't maintained properly before lending, damage may not be covered.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✕</span>
              <span><strong>Abuse claims:</strong> Intentional damage or obvious misuse is investigated before approval.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✕</span>
              <span><strong>Claims outside 48-hour window:</strong> Damage must be reported within 48 hours of tool return.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold">✕</span>
              <span><strong>Exceeding coverage tier:</strong> Claims above your tier limit are capped at your protection level.</span>
            </li>
          </ul>
        </section>

        {/* Dispute Resolution */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dispute Resolution</h2>
          <p className="text-gray-700 mb-4">
            If you disagree with a claim decision, you can appeal within 7 days. Our team will:
          </p>
          <ol className="space-y-2 text-gray-700 ml-4">
            <li>1. Review the baseline and returned photos again</li>
            <li>2. Consider any additional evidence you provide</li>
            <li>3. Make a final decision within 48 hours</li>
          </ol>
          <p className="text-gray-700 mt-4">
            We're committed to fair, transparent decisions. If disputes arise, we always side with evidence, not emotion.
          </p>
        </section>

        {/* Questions */}
        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions?</h2>
          <p className="text-gray-700">
            For more details on coverage, claims, or verification, visit our{' '}
            <Link href="/safety" className="text-blue-600 hover:text-blue-700 font-semibold">
              Safety & Trust
            </Link>
            {' '}page or contact our support team.
          </p>
        </section>
      </main>
    </div>
  );
}
