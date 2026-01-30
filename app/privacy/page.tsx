export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 7, 2026</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              ToolUnity ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our tool-sharing platform.
            </p>
            <p className="text-gray-700">
              By using ToolUnity, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-2">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Name and email address (for account creation)</li>
              <li>Payment information (processed securely through Stripe - we never store your card details)</li>
              <li>Tool listings you create (tool descriptions, photos, condition, estimated value)</li>
              <li>Location information you provide in your profile or tool listings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 mb-2">When you use ToolUnity, we automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Session cookies (to keep you logged in)</li>
              <li>Basic usage data (pages visited, errors encountered)</li>
            </ul>
            <p className="text-gray-700 mt-3 text-sm italic">
              We keep data collection minimal. We don't track your browsing across other sites or sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provide and maintain the ToolUnity platform</li>
              <li>Process rental payments through Stripe</li>
              <li>Pay out earnings to tool owners</li>
              <li>Show your tool listings to potential renters</li>
              <li>Send you important updates about your account or transactions</li>
              <li>Respond to your support requests</li>
              <li>Investigate damage claims and disputes</li>
              <li>Protect against fraud and enforce our terms</li>
            </ul>
            <p className="text-gray-700 mt-3 text-sm italic">
              We don't send marketing emails or sell your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 With Other Users</h3>
            <p className="text-gray-700 mb-4">
              When you list a tool, your name and the location you provide are visible to potential renters. When you request to rent, your name is visible to the tool owner.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Service Providers</h3>
            <p className="text-gray-700 mb-2">
              We share information only with these essential service providers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li><strong>Stripe:</strong> Payment processing (they never share your card details with us)</li>
              <li><strong>Vercel:</strong> Website hosting</li>
              <li><strong>Supabase:</strong> Database and authentication</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Legal Requirements</h3>
            <p className="text-gray-700">
              We may disclose your information if required by law or to protect the safety of our users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We take security seriously. Your data is protected using industry-standard encryption, and your payment information is handled entirely by Stripe—we never see or store your card details.
            </p>
            <p className="text-gray-700">
              All connections to ToolUnity use secure HTTPS encryption, and our database access is restricted and monitored.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Access and Update</h3>
            <p className="text-gray-700 mb-4">
              You can view and update your account information anytime through your profile settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Delete Your Account</h3>
            <p className="text-gray-700 mb-4">
              You can request deletion of your account by contacting us at support@toolunity.co.uk. We'll delete your information within 30 days, except where required by law.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Cookies</h3>
            <p className="text-gray-700">
              You can manage cookies through your browser settings. Note that blocking essential cookies will prevent you from logging in.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We keep your information only as long as you have an active account. When you delete your account, we remove your data within 30 days, except where we're legally required to keep records (like payment transactions).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700">
              ToolUnity is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700">
              Your information is stored on servers in the UK and EU. If you're accessing ToolUnity from outside these regions, your data may be transferred internationally.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of ToolUnity after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <ul className="text-gray-700 space-y-1">
              <li>Email: support@toolunity.co.uk</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
