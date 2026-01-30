'use client';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Safety & Trust</h1>
          <p className="text-xl text-gray-600">How we protect renters, owners, and tools</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Trust Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <p className="text-lg text-gray-900 leading-relaxed">
            Renters are responsible for any damage beyond normal wear, capped at the tool's listed value. Owners have full control over who rents their tools and can approve or decline any request. Clear rules, no surprises.
          </p>
        </div>

        {/* Damage Coverage */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Damage Responsibility</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Who Pays If a Tool Breaks?</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <p className="text-gray-700">
                  <strong>Renter</strong> pays the damage cost, up to the listed value of the tool.
                </p>
                <p className="text-gray-700">
                  <strong>Maximum liability</strong> is always capped at the tool's listed value—no surprise fees.
                </p>
                <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-600">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Example:</p>
                  <p className="text-sm text-gray-700">
                    If you rent a £150 drill and accidentally break it, your maximum liability is £150. That's your absolute cap.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">What Counts as Damage?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="font-semibold text-green-900 mb-3">Normal Wear (No Charge)</p>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✓ Dirt, dust, cosmetic scuffs</li>
                    <li>✓ Normal blade dulling</li>
                    <li>✓ Battery capacity loss from use</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="font-semibold text-red-900 mb-3">Damage (Chargeable)</p>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>✗ Tool no longer functions</li>
                    <li>✗ Broken housing, casing, or safety feature</li>
                    <li>✗ Water or fire damage</li>
                    <li>✗ Missing essential parts</li>
                    <li>✗ Misuse or improper use</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                We charge the <strong>lower of repair or replacement cost</strong>. Disputes are reviewed fairly with evidence from both parties.
              </p>
            </div>
          </div>
        </section>

        {/* Community Trust */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Community Trust</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How We Build Trust</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ul className="space-y-3 text-gray-700">
                  <li>
                    <strong>✓ Verified members</strong> — All members verify their email before renting
                  </li>
                  <li>
                    <strong>✓ Owner approval</strong> — Owners approve each rental request personally
                  </li>
                  <li>
                    <strong>✓ Clear pricing</strong> — Daily rates set by owners, no hidden fees
                  </li>
                  <li>
                    <strong>✓ Direct communication</strong> — Renters and owners communicate directly
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Dispute Resolution</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <ol className="space-y-3 text-gray-700">
                  <li><strong>1. Damage reported</strong> — Owner reports damage via the return form</li>
                  <li><strong>2. 48-hour response window</strong> — Renter has 48 hours to respond with their side</li>
                  <li><strong>3. Review & decision</strong> — ToolUnity reviews evidence and makes a fair decision</li>
                  <li><strong>4. Resolution</strong> — Damage costs are charged to the renter if warranted</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* For Owners */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">For Tool Owners</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              <strong>You're in control.</strong> Here's how we protect your tools:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>✓ <strong>Approve each request</strong> — You choose who rents your tools</li>
              <li>✓ <strong>Set your own rates</strong> — Charge what you think is fair (£1-5+/day)</li>
              <li>✓ <strong>Damage liability on renter</strong> — If damage occurs, the renter pays</li>
              <li>✓ <strong>Keep 85%</strong> — You earn 85% of every rental</li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions?</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700">
              If you have questions about safety, disputes, or how rentals work, contact us at{' '}
              <a href="mailto:support@toolunity.co.uk" className="text-blue-600 hover:text-blue-700 font-semibold">
                support@toolunity.co.uk
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
