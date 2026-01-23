'use client';

import Link from 'next/link';

interface TierSummaryProps {
  effectiveTier: 'basic' | 'standard' | 'pro';
  toolsCount: number;
  isPaidTier: boolean;
  showNextUnlock?: boolean;
  compact?: boolean;
}

const tierLimits: Record<string, { maxBorrows: number; maxValue: number; maxDays: number }> = {
  basic: { maxBorrows: 1, maxValue: 100, maxDays: 3 },
  standard: { maxBorrows: 2, maxValue: 300, maxDays: 7 },
  pro: { maxBorrows: 5, maxValue: 1000, maxDays: 14 },
};

export default function TierSummary({
  effectiveTier,
  toolsCount,
  isPaidTier,
  showNextUnlock = true,
  compact = false,
}: TierSummaryProps) {
  const limits = tierLimits[effectiveTier] || { maxBorrows: 0, maxValue: 0, maxDays: 0 };
  
  const getUnlockStatus = () => {
    if (effectiveTier === 'pro') return null;
    if (effectiveTier === 'standard') {
      if (toolsCount >= 3) return 'Unlocked via 3+ tools';
      return `${toolsCount}/3 tools`;
    }
    if (effectiveTier === 'basic') {
      if (toolsCount >= 1) return 'Unlocked via 1+ tools';
      return isPaidTier ? 'Paid subscription' : 'Free trial / Upgrade';
    }
    return 'No tier';
  };

  const getNextUnlockMessage = () => {
    if (effectiveTier === 'pro') return null;
    if (effectiveTier === 'standard') return null;
    if (effectiveTier === 'basic' && toolsCount >= 1) {
      const remaining = 3 - toolsCount;
      return {
        text: `List ${remaining} more tool${remaining !== 1 ? 's' : ''} to unlock Standard`,
        action: 'List Tool',
        href: '/tools/add',
      };
    }
    return {
      text: 'List 1 tool to unlock Basic',
      action: 'List First Tool',
      href: '/tools/add',
    };
  };

  const unlockStatus = getUnlockStatus();
  const nextUnlock = showNextUnlock ? getNextUnlockMessage() : null;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-600 font-semibold mb-1">YOUR TIER</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600 capitalize">{effectiveTier}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {unlockStatus}
              </span>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-gray-600">Max {limits.maxBorrows} borrow{limits.maxBorrows !== 1 ? 's' : ''}</p>
            <p className="font-semibold text-gray-900">£{limits.maxValue} value</p>
            <p className="text-gray-600">{limits.maxDays} days max</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-md p-8 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Tier Info */}
        <div>
          <div className="mb-6">
            <p className="text-blue-100 text-sm font-semibold mb-2">YOUR TIER</p>
            <h3 className="text-4xl font-bold mb-3 capitalize">{effectiveTier}</h3>
            <div className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
              {isPaidTier && toolsCount > 0 ? (
                <span>Paid + {toolsCount} tool{toolsCount !== 1 ? 's' : ''} listed</span>
              ) : isPaidTier ? (
                <span>Paid subscription</span>
              ) : toolsCount > 0 ? (
                <span>✓ Unlocked via {toolsCount} tool{toolsCount !== 1 ? 's' : ''}</span>
              ) : (
                <span>No tier - List tools or subscribe</span>
              )}
            </div>
          </div>

          {/* Current Limits */}
          <div className="space-y-3">
            <p className="text-blue-100 text-sm font-semibold mb-3">YOUR LIMITS</p>
            <div className="flex justify-between text-sm">
              <span className="text-blue-100">Active borrows:</span>
              <span className="font-bold">{limits.maxBorrows} at a time</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-100">Coverage limit:</span>
              <span className="font-bold">£{limits.maxValue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-100">Borrow duration:</span>
              <span className="font-bold">Up to {limits.maxDays} days</span>
            </div>
          </div>
        </div>

        {/* Right: Next Unlock or Features */}
        <div className="flex flex-col justify-between">
          {nextUnlock ? (
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-500 text-sm mb-2">UNLOCK NEXT TIER</p>
              <p className="text-sm mb-4 text-gray-700">{nextUnlock.text}</p>
              <Link
                href={nextUnlock.href}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold transition"
              >
                {nextUnlock.action} →
              </Link>
            </div>
          ) : effectiveTier === 'pro' ? (
            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-sm font-semibold mb-2">💎 Pro Limits</p>
              <p className="text-sm text-gray-600">
                Maximum limits across all tiers. Unlimited flexibility for power users.
              </p>
            </div>
          ) : null}

          {(effectiveTier === 'basic' || effectiveTier === 'standard') && !isPaidTier && (
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-700 text-sm font-semibold mb-2">💡 Keep Your Tier</p>
              <p className="text-sm text-gray-600">
                As long as you keep your {toolsCount} tool{toolsCount !== 1 ? 's' : ''} listed, your {effectiveTier} tier stays active with full coverage.
              </p>
            </div>
          )}

          {isPaidTier && (
            <div className="flex gap-2">
              <Link
                href="/pricing"
                className="flex-1 text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold transition"
              >
                View Plans
              </Link>
              <Link
                href="/profile"
                className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-semibold transition"
              >
                Manage
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
