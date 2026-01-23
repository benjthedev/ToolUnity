import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';

/**
 * Validate if user can borrow a tool and return detailed messaging
 * This endpoint checks:
 * - User has active membership (paid or free via listing)
 * - User hasn't reached active borrow limit
 * - Tool value doesn't exceed user's value cap
 * - Borrow duration fits within user's max duration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'not_authenticated',
          message: 'You must be signed in to borrow tools',
          action: 'Sign in or create an account',
          actionType: 'login',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { toolId, startDate, endDate } = body;

    if (!toolId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Tool ID, start date, and end date required' },
        { status: 400 }
      );
    }

    // Get user profile and tier info
    const { data: userProfile } = await supabase
      .from('users_ext')
      .select('subscription_tier, tools_count')
      .eq('user_id', session.user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'no_profile',
          message: 'Please complete your profile',
          action: 'Go to profile',
          actionType: 'profile',
        },
        { status: 404 }
      );
    }

    // Calculate effective tier
    let effectiveTier = userProfile.subscription_tier || 'free';
    let hasMembership = false;

    if (userProfile.tools_count >= 3) {
      effectiveTier = 'standard';
      hasMembership = true;
    } else if (userProfile.tools_count >= 1 && (effectiveTier === 'free' || effectiveTier === 'none')) {
      effectiveTier = 'basic';
      hasMembership = true;
    } else if (userProfile.subscription_tier === 'basic' || userProfile.subscription_tier === 'standard' || userProfile.subscription_tier === 'pro') {
      hasMembership = true;
    }

    // Check if user has any membership
    if (!hasMembership) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'no_membership',
          message: 'You need membership to borrow tools',
          details: 'Subscribe to a plan or list tools to unlock free membership',
          action: 'View membership options',
          actionType: 'pricing',
          suggestedPath: {
            option1: 'Subscribe to Basic (£2/mo) or Standard (£10/mo)',
            option2: 'List 1 tool to unlock Basic free (1 borrow, £100 value)',
            option3: 'List 3 tools to unlock Standard free (2 borrows, £300 value)',
          },
        },
        { status: 403 }
      );
    }

    // Get tool info
    const { data: tool } = await supabase
      .from('tools')
      .select('id, tool_value')
      .eq('id', toolId)
      .single();

    if (!tool) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'tool_not_found',
          message: 'Tool not found',
        },
        { status: 404 }
      );
    }

    // Determine tier limits
    const tierLimits: Record<string, { maxBorrows: number; maxValue: number; maxDays: number }> = {
      basic: { maxBorrows: 1, maxValue: 100, maxDays: 3 },
      standard: { maxBorrows: 2, maxValue: 300, maxDays: 7 },
      pro: { maxBorrows: 5, maxValue: 1000, maxDays: 14 },
    };

    const limits = tierLimits[effectiveTier] || tierLimits.basic;

    // Check active borrow count
    const { data: activeBorrows } = await supabase
      .from('borrow_requests')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('status', 'approved');

    const activeBorrowCount = activeBorrows?.length || 0;

    if (activeBorrowCount >= limits.maxBorrows) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'borrow_limit_reached',
          message: `You've reached your active borrow limit (${activeBorrowCount}/${limits.maxBorrows})`,
          tier: effectiveTier,
          currentBorrows: activeBorrowCount,
          maxBorrows: limits.maxBorrows,
          action: `Wait for a borrow to complete, or upgrade to ${effectiveTier === 'basic' ? 'Standard' : 'Pro'}`,
          actionType: effectiveTier === 'basic' ? 'upgrade_to_standard' : 'upgrade_to_pro',
        },
        { status: 403 }
      );
    }

    // Check tool value against tier limit
    if (tool.tool_value > limits.maxValue) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'value_limit_exceeded',
          message: `Tool value (£${tool.tool_value}) exceeds your limit`,
          tier: effectiveTier,
          toolValue: tool.tool_value,
          userValueLimit: limits.maxValue,
          action: `Upgrade to ${effectiveTier === 'basic' ? 'Standard (£300 limit)' : 'Pro (£1,000 limit)'} to borrow this tool`,
          actionType: effectiveTier === 'basic' ? 'upgrade_to_standard' : 'upgrade_to_pro',
        },
        { status: 403 }
      );
    }

    // Calculate duration and check against limit
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (durationDays > limits.maxDays) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'duration_exceeds_limit',
          message: `Borrow duration (${durationDays} days) exceeds your limit`,
          tier: effectiveTier,
          requestedDays: durationDays,
          maxDays: limits.maxDays,
          action: `Shorten your borrow to ${limits.maxDays} days, or upgrade to ${effectiveTier === 'basic' ? 'Standard (7 days)' : 'Pro (14 days)'}`,
          actionType: effectiveTier === 'basic' ? 'upgrade_to_standard' : 'upgrade_to_pro',
        },
        { status: 403 }
      );
    }

    // All checks passed
    return NextResponse.json(
      {
        canBorrow: true,
        tier: effectiveTier,
        limits: {
          maxBorrows: limits.maxBorrows,
          currentBorrows: activeBorrowCount,
          maxValue: limits.maxValue,
          maxDays: limits.maxDays,
        },
        tool: {
          value: tool.tool_value,
          durationDays,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Borrow validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
