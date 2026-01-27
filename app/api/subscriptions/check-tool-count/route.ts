import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { serverLog } from '@/lib/logger';

/**
 * Check user's active tool count and automatically adjust subscription tier.
 * 
 * Rules:
 * - 3+ active tools → Standard tier (free waiver)
 * - 1+ active tools → Basic tier (free waiver)
 * - If no tools and has paid subscription, keep paid tier
 * - Otherwise no borrowing access
 * 
 * This can be called:
 * - After a tool is created/approved
 * - After a tool is deleted/deactivated
 * - On dashboard load to verify current status
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Count approved, active tools owned by this user
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id')
      .eq('owner_id', userId)
      .eq('available', true);

    if (toolsError) {
      serverLog.error('Error counting tools:', toolsError);
      return NextResponse.json(
        { error: 'Failed to count tools' },
        { status: 500 }
      );
    }

    const toolCount = tools?.length || 0;

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users_ext')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      serverLog.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const currentTier = userData?.subscription_tier || 'none';

    // Determine effective tier based on tool count
    // Logic: 3+ tools → standard (free), 1+ tools → basic (free), otherwise stay on paid tier or none
    let newTier = currentTier;
    let action = 'no_change';

    if (toolCount >= 3) {
      // User qualifies for free Standard tier via tool waiver
      if (currentTier !== 'standard' && currentTier !== 'pro') {
        newTier = 'standard';
        action = 'upgraded_to_standard_free';
      }
    } else if (toolCount >= 1) {
      // User qualifies for free Basic tier via tool waiver
      if (currentTier === 'none' || currentTier === 'free') {
        newTier = 'basic';
        action = 'upgraded_to_basic_free';
      }
      // If they already have standard or pro, keep it
    } else {
      // User has no tools
      // If they were on a free waiver tier, revert to none
      if (currentTier === 'basic' || currentTier === 'standard') {
        newTier = 'none';
        action = 'downgraded_no_tools';
      }
      // If they have a paid tier (kept for paid subscription), keep it
    }

    // Update users_ext if tier changed
    if (newTier !== currentTier) {
      const { error: updateError } = await supabase
        .from('users_ext')
        .update({
          subscription_tier: newTier,
          tools_count: toolCount,
        })
        .eq('user_id', userId);

      if (updateError) {
        serverLog.error('Error updating user tier:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription tier' },
          { status: 500 }
        );
      }
    } else {
      // Just update tool count
      await supabase
        .from('users_ext')
        .update({ tools_count: toolCount })
        .eq('user_id', userId);
    }

    return NextResponse.json({
      success: true,
      action,
      toolCount,
      previousTier: currentTier,
      newTier,
      message: action === 'no_change' ? 'Tier unchanged' : `Tier updated: ${currentTier} → ${newTier}`,
    });
  } catch (error) {
    serverLog.error('Unexpected error in subscription check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
