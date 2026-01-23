import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin endpoint to override subscriptions
 * Allows admins to:
 * - Manually revoke free tool owner grants
 * - Set manual subscription values
 * - Handle fraud/inactive cases
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, action, newPlan, reason } = await request.json();

    // TODO: Add proper admin authentication/authorization
    // For now, this is a placeholder - implement your own admin check

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing userId or action' },
        { status: 400 }
      );
    }

    if (action === 'revoke_tool_owner_grant') {
      // Remove the free tool owner grant and revert to previous plan
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }

      const revertPlan = subscription.previous_plan || 'free';
      const revertPrice = revertPlan === 'free' ? 0 : revertPlan === 'standard' ? 1000 : 2500;

      const { data: updated, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan: revertPlan,
          monthly_price: revertPrice,
          is_free_tool_owner_grant: false,
          granted_tool_count: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'revoked',
        message: `Revoked free tool owner grant. Reverted to ${revertPlan}.`,
        reason,
        subscription: updated,
      });
    }

    if (action === 'set_plan') {
      // Manually set a plan
      const priceMap: Record<string, number> = {
        free: 0,
        standard: 1000,
        pro: 2500,
      };

      const monthlyPrice = priceMap[newPlan] || 0;

      const { data: updated, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan: newPlan,
          monthly_price: monthlyPrice,
          is_free_tool_owner_grant: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to set plan' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: 'set_plan',
        message: `Admin set plan to ${newPlan}`,
        reason,
        subscription: updated,
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin subscription override error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
