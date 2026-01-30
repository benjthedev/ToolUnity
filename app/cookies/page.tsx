export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 7, 2026</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
            <p className="text-gray-700">
              ToolUnity uses cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1 Essential Cookies</h3>
            <p className="text-gray-700 mb-2">
              These cookies are necessary for the platform to function properly. They enable core functionality such as:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Authentication and security</li>
              <li>Session management</li>
              <li>Load balancing</li>
              <li>Form submission</li>
            </ul>
            <p className="text-gray-700">
              <strong>Duration:</strong> Session or up to 1 year
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.2 Performance Cookies</h3>
            <p className="text-gray-700 mb-2">
              These cookies help us understand how visitors interact with our platform by collecting anonymous information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Pages visited</li>
              <li>Time spent on pages</li>
              <li>Error messages encountered</li>
              <li>User navigation patterns</li>
            </ul>
            <p className="text-gray-700">
              <strong>Duration:</strong> Up to 2 years
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.3 Functionality Cookies</h3>
            <p className="text-gray-700 mb-2">
              These cookies remember your preferences and choices to provide enhanced features:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Language preferences</li>
              <li>Location settings for tool search</li>
              <li>Display preferences</li>
              <li>Previously viewed tools</li>
            </ul>
            <p className="text-gray-700">
              <strong>Duration:</strong> Up to 1 year
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.4 Targeting/Advertising Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies may be set by our advertising partners to build a profile of your interests and show relevant ads on other websites. They work by uniquely identifying your browser and device.
            </p>
            <p className="text-gray-700">
              <strong>Duration:</strong> Up to 2 years
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-2">
              We use services from third-party providers that may set cookies on your device:
            </p>
            
            <div className="space-y-4 mt-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">Stripe</h4>
                <p className="text-gray-700 text-sm">
                  Payment processing and fraud prevention. Stripe's cookies help secure transactions and detect fraudulent activity.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">Supabase</h4>
                <p className="text-gray-700 text-sm">
                  Authentication and database services. Supabase cookies manage your login session and authentication state.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">Vercel Analytics</h4>
                <p className="text-gray-700 text-sm">
                  Website performance monitoring. Vercel cookies help us understand page load times and optimize performance.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How to Manage Cookies</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>View and delete cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies</li>
              <li>Clear cookies when you close your browser</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Note:</strong> Blocking essential cookies may affect the functionality of ToolUnity and prevent you from using certain features.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Browser-Specific Instructions</h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data
              </p>
              <p>
                <strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data
              </p>
              <p>
                <strong>Safari:</strong> Preferences → Privacy → Manage Website Data
              </p>
              <p>
                <strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Opt-Out Tools</h3>
            <p className="text-gray-700 mb-2">
              You can opt out of targeted advertising cookies using these resources:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Network Advertising Initiative (NAI): <span className="text-blue-600">optout.networkadvertising.org</span></li>
              <li>Digital Advertising Alliance (DAA): <span className="text-blue-600">optout.aboutads.info</span></li>
              <li>European Interactive Digital Advertising Alliance (EDAA): <span className="text-blue-600">youronlinechoices.eu</span></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Do Not Track Signals</h2>
            <p className="text-gray-700">
              Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that you do not want to be tracked. Currently, there is no industry standard for how to respond to DNT signals. ToolUnity does not currently respond to DNT signals, but we provide you with choices about cookies as described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Mobile Devices</h2>
            <p className="text-gray-700 mb-4">
              Mobile devices may use advertising identifiers instead of cookies for similar purposes. You can typically manage these through your device settings:
            </p>
            <p className="text-gray-700 mb-2">
              <strong>iOS:</strong> Settings → Privacy → Advertising → Limit Ad Tracking
            </p>
            <p className="text-gray-700">
              <strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Cookie Policy</h2>
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. We will notify you of significant changes by posting the updated policy on this page with a new "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. More Information</h2>
            <p className="text-gray-700 mb-4">
              For more information about how we collect and use your personal information, please see our Privacy Policy.
            </p>
            <p className="text-gray-700 mb-2">
              If you have questions about our use of cookies, please contact us:
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
