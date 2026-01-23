export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: January 7, 2026</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to ToolTree. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. Continued use of ToolTree after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              ToolTree provides a platform that facilitates tool sharing between users. ToolTree does not own, rent, or lend tools. While we administer protection programmes and platform rules, we are not the owner or borrower of any tool.
            </p>
            <p className="text-gray-700">
              ToolTree offers damage protection coverage for listed tools but does not guarantee the condition, safety, or legality of any tools or the truth or accuracy of any listings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              You must be at least 18 years old to create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Account Suspension</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or misuse the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Membership Tiers and Subscriptions</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Tier Levels</h3>
            <p className="text-gray-700 mb-2">ToolTree offers three membership tiers:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li><strong>Basic:</strong> £2/month or free when you list 1+ tools</li>
              <li><strong>Standard:</strong> £10/month or free when you list 3+ tools</li>
              <li><strong>Pro:</strong> £25/month (subscription only)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Billing</h3>
            <p className="text-gray-700 mb-4">
              Subscriptions are billed monthly in advance. All fees are non-refundable except as required by law. You authorize us to charge your payment method on a recurring basis.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Cancellation</h3>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.4 Tool-Based Tier Unlocks</h3>
            <p className="text-gray-700">
              Free tier access is contingent on maintaining the required number of active tool listings. If your tool count drops below the threshold, you may lose tier benefits unless you have an active paid subscription.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Tool Listings (For Owners)</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 Listing Accuracy</h3>
            <p className="text-gray-700 mb-4">
              You must provide accurate information about your tools, including condition, value, and any safety considerations. Misleading listings may result in account suspension.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Tool Ownership</h3>
            <p className="text-gray-700 mb-4">
              You represent that you own or have permission to list and lend all tools on your account. You may not list stolen or illegally obtained items.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 Tool Condition</h3>
            <p className="text-gray-700 mb-4">
              All tools must be in safe, working condition. You must not list tools that are dangerous, defective, or prohibited by law.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.4 Approval Rights</h3>
            <p className="text-gray-700">
              As the Owner, you have the right to approve or decline any borrow requests at your discretion. You are responsible for coordinating pickup and return logistics with the Borrower.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Borrowing Tools</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Borrowing Limits</h3>
            <p className="text-gray-700 mb-2">Your tier determines your borrowing limits:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li><strong>Basic:</strong> 1 active borrow, up to £100 value, up to 3 days</li>
              <li><strong>Standard:</strong> 2 active borrows, up to £300 value, up to 7 days</li>
              <li><strong>Pro:</strong> 5 active borrows, up to £1,000 value, up to 14 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Borrower Responsibilities</h3>
            <p className="text-gray-700 mb-2">As a Borrower, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Use tools safely and for their intended purpose</li>
              <li>Return tools on time and in the same condition as received</li>
              <li>Report any damage immediately</li>
              <li>Not lend borrowed tools to others</li>
              <li>Follow all manufacturer instructions and safety guidelines</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Subscription Requirement</h3>
            <p className="text-gray-700">
              You must have an active subscription tier (Basic, Standard, or Pro) or qualify for a free tier by listing tools to borrow. Borrowing privileges are subject to your tier's limits. Accounts may be suspended for misuse or repeated violations of borrowing terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Damage Protection Coverage</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.1 Coverage Limits</h3>
            <p className="text-gray-700 mb-4">
              ToolTree administers a discretionary damage protection programme, subject to these Terms, up to the applicable tier coverage limit. Borrowers are liable for damage or loss up to the tool's stated value, capped at the tier limit.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.2 Claims Process</h3>
            <p className="text-gray-700 mb-4">
              If a tool is damaged or not returned, the Owner must report it within 48 hours. We will investigate and determine liability based on evidence provided by both parties.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.3 Exclusions</h3>
            <p className="text-gray-700 mb-2">Coverage does not include:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Normal wear and tear</li>
              <li>Pre-existing damage not disclosed in the listing</li>
              <li>Intentional damage or misuse</li>
              <li>Failure to follow manufacturer instructions or safety guidance</li>
              <li>Tools used for commercial purposes without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Prohibited Conduct</h2>
            <p className="text-gray-700 mb-2">You may not:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>List dangerous, illegal, or counterfeit items</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Attempt to defraud ToolTree or other users</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Use automated systems to access the platform without permission</li>
              <li>Collect user information without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Liability and Disclaimers</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.1 Platform Role</h3>
            <p className="text-gray-700 mb-4">
              ToolTree acts as an intermediary platform only. We do not own, control, or inspect tools. We are not responsible for the actions, conduct, or content of users.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.2 No Warranties</h3>
            <p className="text-gray-700 mb-4">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.3 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TOOLTREE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.4 Assumption of Risk</h3>
            <p className="text-gray-700 mb-4">
              You acknowledge that using tools involves inherent risks, including personal injury, property damage, and other hazards. You voluntarily assume all risks associated with borrowing, using, handling, and transporting tools obtained through the platform. ToolTree is not responsible for injuries or damages arising from tool use.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.5 Indemnification</h3>
            <p className="text-gray-700">
              You agree to indemnify and hold ToolTree harmless from any claims, damages, or expenses arising from your use of the platform, your violation of these Terms, or your violation of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              If you have a dispute with another user, you agree to resolve it directly with that user. ToolTree may, at its sole discretion, assist in mediation but has no obligation to resolve disputes between users.
            </p>
            <p className="text-gray-700">
              Any disputes with ToolTree shall be governed by the laws of England and Wales, and you agree to submit to the exclusive jurisdiction of the courts in that region.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700">
              We may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or for any other reason. Upon termination, you must immediately cease using the platform. Provisions that should survive termination (including liability limitations) shall remain in effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about these Terms, please contact us:
            </p>
            <ul className="text-gray-700 space-y-1">
              <li>Email: support@tooltree.com</li>
              <li>Phone: +44 (0) 123 456 7890</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
