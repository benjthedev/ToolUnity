/**
 * Shared tier calculation logic used across the application
 * Ensures consistent tier determination on both client and server
 */

export interface TierInfo {
  effectiveTier: 'basic' | 'standard' | 'pro' | 'free' | 'none';
  action: string;
  isFreeTier: boolean;
}

/**
 * Calculate the effective tier based on subscription tier and tool count
 * 
 * Rules:
 * - Paid tiers (basic/standard/pro) always take priority
 * - 3+ tools → Standard tier (free waiver)
 * - 1+ tools → Basic tier (free waiver)
 * - 0 tools → None (no access unless paid)
 */
export function calculateEffectiveTier(
  subscriptionTier: string | null | undefined,
  toolCount: number
): TierInfo {
  const currentTier = subscriptionTier || 'none';
  let newTier = currentTier;
  let action = 'no_change';
  let isFreeTier = false;

  if (toolCount >= 3) {
    // User qualifies for free Standard tier via tool waiver
    if (currentTier !== 'standard' && currentTier !== 'pro') {
      newTier = 'standard';
      action = 'upgraded_to_standard_free';
      isFreeTier = true;
    } else if (currentTier === 'standard' || currentTier === 'pro') {
      isFreeTier = false; // Paid tier
    }
  } else if (toolCount >= 1) {
    // User qualifies for free Basic tier via tool waiver
    if (currentTier === 'none' || currentTier === 'free') {
      newTier = 'basic';
      action = 'upgraded_to_basic_free';
      isFreeTier = true;
    } else if (currentTier === 'basic' || currentTier === 'standard' || currentTier === 'pro') {
      // They have a paid tier or already have basic, keep it
      isFreeTier = currentTier === 'basic' && subscriptionTier === 'none';
    }
  } else {
    // User has no tools
    // Only downgrade if they DON'T have a paid subscription tier
    // Paid tiers (basic/standard/pro set by subscription) should be kept
    const isPaidSubscription = subscriptionTier === 'basic' || subscriptionTier === 'standard' || subscriptionTier === 'pro';
    
    if (!isPaidSubscription && (currentTier === 'basic' || currentTier === 'standard')) {
      // They had a free tier from listing tools, but no longer have tools
      newTier = 'none';
      action = 'downgraded_no_tools';
      isFreeTier = false;
    } else if (isPaidSubscription) {
      // They have a paid subscription - keep their tier
      newTier = subscriptionTier;
      action = 'paid_subscription';
      isFreeTier = false;
    }
  }

  return {
    effectiveTier: newTier as 'basic' | 'standard' | 'pro' | 'free' | 'none',
    action,
    isFreeTier,
  };
}

/**
 * Get tier limits for borrowing (max items, max value, max days)
 */
export function getTierLimits(tier: 'basic' | 'standard' | 'pro' | 'free' | 'none') {
  const tierLimits: Record<string, { maxBorrows: number; maxValue: number; maxDays: number }> = {
    basic: { maxBorrows: 1, maxValue: 100, maxDays: 3 },
    standard: { maxBorrows: 2, maxValue: 300, maxDays: 7 },
    pro: { maxBorrows: 5, maxValue: 1000, maxDays: 14 },
    free: { maxBorrows: 0, maxValue: 0, maxDays: 0 },
    none: { maxBorrows: 0, maxValue: 0, maxDays: 0 },
  };

  return tierLimits[tier] || { maxBorrows: 0, maxValue: 0, maxDays: 0 };
}
