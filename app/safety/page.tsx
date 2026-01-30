'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';

export default function SafetyPage() {
  const { session } = useAuth();
  const [effectiveTier, setEffectiveTier] = useState<string>('none');

  useEffect(() => {
    if (session?.user?.id) {
      const fetchTier = async () => {
        const { data } = await supabase
          .from('users_ext')
          .select('subscription_tier, tools_count')
          .eq('user_id', session.user?.id || '')
          .single();

        if (data) {
          let tier = data.subscription_tier || 'none';
          if (data.tools_count >= 3) {
            tier = 'standard';
          } else if (data.tools_count >= 1 && (tier === 'none' || tier === 'free')) {
            tier = 'basic';
          }
          setEffectiveTier(tier);
        }
      };
      fetchTier();
    }
  }, [session?.user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Safety & Trust</h1>
          <p className="text-xl text-gray-600">How we protect borrowers, owners, and tools</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Trust Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <p className="text-lg text-gray-900 leading-relaxed">
            Borrowers are responsible for damage beyond normal wear, capped by their membership tier. ToolUnity guarantees owners are reimbursed quickly and fairly. Your subscription tier determines your borrowing limits and coverage. Clear limits, clear rules, no surprises.
          </p>
        </div>

        {/* Damage Coverage */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Damage Coverage</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Who Pays If a Tool Breaks?</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <p className="text-gray-700">
                  <strong>Borrower</strong> pays the damage cost, up to the value of the tool.
                </p>
                <p className="text-gray-700">
                  <strong>ToolUnity guarantees</strong> the owner is made whole even if the borrower refuses to pay or the charge fails.
                </p>
                <div className="bg-gray-50 p-4 rounded border-l-4 border-blue-600">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Order of Responsibility:</p>
                  <ol className="text-sm text-gray-700 space-y-1 ml-4 list-decimal">
                    <li>Borrower (primary)</li>
                    <li>ToolUnity (backup guarantee)</li>
                    <li>Owner never bears the loss</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Liability Caps by Membership Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`rounded-lg p-6 ${effectiveTier === 'basic' ? 'bg-blue-50 border-2 border-blue-400' : 'bg-white border border-gray-200'}`}>
                  <p className="text-sm text-gray-600 mb-2">Basic (£2/mo)</p>
                  <p className={`text-3xl font-bold ${effectiveTier === 'basic' ? 'text-blue-600' : 'text-gray-900'}`}>£100</p>
                  <p className="text-xs text-gray-600 mt-2">Maximum liability per incident</p>
                  {effectiveTier === 'basic' && <p className="text-xs text-blue-600 font-semibold mt-2">← Your tier</p>}
                </div>
                <div className={`rounded-lg p-6 ${effectiveTier === 'standard' ? 'bg-blue-50 border-2 border-blue-400' : 'bg-white border border-gray-200'}`}>
                  <p className="text-sm text-gray-600 mb-2">Standard (£10/mo)</p>
                  <p className={`text-3xl font-bold ${effectiveTier === 'standard' ? 'text-blue-600' : 'text-gray-900'}`}>£300</p>
                  <p className="text-xs text-gray-600 mt-2">Maximum liability per incident</p>
                  {effectiveTier === 'standard' && <p className="text-xs text-blue-600 font-semibold mt-2">← Your tier</p>}
                </div>
                <div className={`rounded-lg p-6 ${effectiveTier === 'pro' ? 'bg-blue-50 border-2 border-blue-400' : 'bg-white border border-gray-200'}`}>
                  <p className="text-sm text-gray-600 mb-2">Pro (£25/mo - Coming Soon)</p>
                  <p className={`text-3xl font-bold ${effectiveTier === 'pro' ? 'text-blue-600' : 'text-gray-900'}`}>£1,000</p>
                  <p className="text-xs text-gray-600 mt-2">Maximum liability per incident</p>
                  {effectiveTier === 'pro' && <p className="text-xs text-blue-600 font-semibold mt-2">← Your tier</p>}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Borrowers can never be charged more than their tier cap for a single incident. <strong>No deductibles</strong> — you're only charged if damage occurs.
              </p>
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

        {/* Membership Protection */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Membership Protection</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How It Works</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  Your subscription tier determines your borrowing privileges and protection level:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li>
                    <strong>✓ Basic</strong> — 1 active borrow, up to £100 coverage
                  </li>
                  <li>
                    <strong>✓ Standard</strong> — 2 active borrows, up to £300 coverage
                  </li>
                  <li>
                    <strong>✓ Pro</strong> — 5 active borrows, up to £1,000 coverage
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Community Trust</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">Our community is built on mutual respect:</p>
                <ul className="space-y-2 text-gray-700 ml-4 list-disc">
                  <li>All members are verified with email</li>
                  <li>Borrow history and reviews build reputation</li>
                  <li>Owners can approve or decline requests</li>
                </ul>
                <p className="text-gray-700 mt-4 pt-4 border-t border-gray-200">
                  <strong>Free access:</strong> List 1+ tools to unlock Basic, or 3+ tools to unlock Standard for free!
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Damage Claim Process</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <ol className="space-y-3 text-gray-700">
                  <li><strong>1. Damage reported</strong> — Tool owner reports damage via the return form</li>
                  <li><strong>2. 48-hour response window</strong> — Borrower has 48 hours to respond with their side</li>
                  <li><strong>3. Review & decision</strong> — ToolUnity reviews evidence and makes a fair decision</li>
                  <li><strong>4. Resolution</strong> — Both parties work together to resolve the issue</li>
                  <li><strong>5. Owner protected</strong> — ToolUnity ensures fair outcomes for all parties</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Owner Protection */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Owner Protection</h2>
          
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">We Guarantee Reimbursement</h3>
              <p className="text-gray-700 mb-4">
                As an owner, you're protected by ToolUnity. If a tool is damaged:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <strong>✓ You're paid</strong> within 48 hours of damage approval
                </li>
                <li>
                  <strong>✓ You don't wait</strong> for the borrower to dispute or for a payment failure
                </li>
                <li>
                  <strong>✓ ToolUnity recovers</strong> the funds from the borrower separately
                </li>
                <li>
                  <strong>✓ You're never out-of-pocket</strong> — We guarantee it
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How You Get Paid</h3>
              <p className="text-gray-700">
                Reimbursements are paid via <strong>Stripe payouts</strong> directly to your bank account. You'll see the funds in 1-2 business days (depending on your bank).
              </p>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
          <p className="text-gray-700 mb-4">
            We're here to help. If you have questions about damage coverage, card policies, or how we protect you, reach out:
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> support@toolunity.co.uk
          </p>
        </section>

      </div>
    </div>
  );
}
