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
              Welcome to ToolUnity. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. Continued use of ToolUnity after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              ToolUnity provides a platform that facilitates tool sharing between users. ToolUnity does not own, rent, or lend tools. While we administer protection programmes and platform rules, we are not the owner or borrower of any tool.
            </p>
            <p className="text-gray-700">
              ToolUnity offers damage protection coverage for listed tools but does not guarantee the condition, safety, or legality of any tools or the truth or accuracy of any listings.
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Rentals and Payments</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Rental Fees</h3>
            <p className="text-gray-700 mb-4">
              Tool owners set their own daily rental rates. Renters pay the daily rate multiplied by the number of rental days. ToolUnity retains 30% of the rental fee as a platform fee; owners receive 70%.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Payment Processing</h3>
            <p className="text-gray-700 mb-4">
              All payments are processed through Stripe. By using our service, you agree to Stripe's terms of service. Rental fees are collected at the time of booking.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Refunds</h3>
            <p className="text-gray-700">
              Refunds may be issued at ToolUnity's discretion for cancelled rentals or disputes. Contact support for refund requests.
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Renting Tools</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1 Rental Terms</h3>
            <p className="text-gray-700 mb-4">
              Renters pay the owner's daily rate for the duration of the rental. There are no borrowing limits—any registered user can rent any available tool by paying the rental fee.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2 Renter Responsibilities</h3>
            <p className="text-gray-700 mb-2">As a Renter, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Use tools safely and for their intended purpose</li>
              <li>Return tools on time and in the same condition as received</li>
              <li>Report any damage immediately</li>
              <li>Not lend rented tools to others</li>
              <li>Follow all manufacturer instructions and safety guidelines</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3 Account Requirements</h3>
            <p className="text-gray-700">
              You must have a verified account to rent tools. Accounts may be suspended for misuse or repeated violations of rental terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Damage Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.1 Liability Limits</h3>
            <p className="text-gray-700 mb-4">
              Renters are liable for damage or loss up to the tool's listed value. This is the maximum amount a renter may be charged for any single incident.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.2 Claims Process</h3>
            <p className="text-gray-700 mb-4">
              If a tool is damaged or not returned, the Owner must report it within 48 hours. We will investigate and determine liability based on evidence provided by both parties.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">7.3 Exclusions</h3>
            <p className="text-gray-700 mb-2">Liability coverage does not include:</p>
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
              <li>Attempt to defraud ToolUnity or other users</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Use automated systems to access the platform without permission</li>
              <li>Collect user information without consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Liability and Disclaimers</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.1 Platform Role</h3>
            <p className="text-gray-700 mb-4">
              ToolUnity acts as an intermediary platform only. We do not own, control, or inspect tools. We are not responsible for the actions, conduct, or content of users.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.2 No Warranties</h3>
            <p className="text-gray-700 mb-4">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.3 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TOOLUNITY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.4 Assumption of Risk</h3>
            <p className="text-gray-700 mb-4">
              You acknowledge that using tools involves inherent risks, including personal injury, property damage, and other hazards. You voluntarily assume all risks associated with borrowing, using, handling, and transporting tools obtained through the platform. ToolUnity is not responsible for injuries or damages arising from tool use.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.5 Indemnification</h3>
            <p className="text-gray-700">
              You agree to indemnify and hold ToolUnity harmless from any claims, damages, or expenses arising from your use of the platform, your violation of these Terms, or your violation of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              If you have a dispute with another user, you agree to resolve it directly with that user. ToolUnity may, at its sole discretion, assist in mediation but has no obligation to resolve disputes between users.
            </p>
            <p className="text-gray-700">
              Any disputes with ToolUnity shall be governed by the laws of England and Wales, and you agree to submit to the exclusive jurisdiction of the courts in that region.
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
              <li>Email: support@toolunity.co.uk</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
