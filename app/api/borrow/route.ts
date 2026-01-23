import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: 'CSRF token validation failed', reason: 'csrf_invalid' },
        { status: 403 }
      );
    }

    // Get session - pass authOptions explicitly
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          reason: 'not_authenticated',
          message: 'You must be signed in to borrow tools',
        },
        { status: 401 }
      );
    }

    // Rate limit borrow requests (10 per hour per user)
    const rateLimitCheck = checkRateLimitByUserId(
      session.user.id,
      RATE_LIMIT_CONFIGS.borrow.maxAttempts,
      RATE_LIMIT_CONFIGS.borrow.windowMs
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many borrow requests',
          reason: 'rate_limited',
          message: `Please wait before making another borrow request (${Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000)} minutes remaining)`,
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { toolId, startDate, endDate, notes } = body;

    if (!toolId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Tool ID, start date, and end date required' },
        { status: 400 }
      );
    }

    // Get user profile and tier info
    const { data: userProfile } = await supabase
      .from('users_ext')
      .select('subscription_tier, tools_count, email_verified')
      .eq('user_id', session.user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        {
          error: 'User profile not found',
          reason: 'no_profile',
          message: 'Please complete your profile',
        },
        { status: 404 }
      );
    }

    // Check email verification before allowing borrow
    if (!userProfile.email_verified) {
      return NextResponse.json(
        {
          error: 'Email verification required',
          reason: 'email_not_verified',
          message: 'Please verify your email address before borrowing tools',
          action: 'Check your inbox for verification link',
        },
        { status: 403 }
      );
    }

    // Calculate effective tier (account for both paid subscriptions and free tool unlocks)
    let effectiveTier = userProfile.subscription_tier || 'free';
    const hasPaidTier = userProfile.subscription_tier === 'basic' || userProfile.subscription_tier === 'standard' || userProfile.subscription_tier === 'pro';

    if (hasPaidTier) {
      effectiveTier = userProfile.subscription_tier;
    } else if (userProfile.tools_count >= 3) {
      effectiveTier = 'standard';
    } else if (userProfile.tools_count >= 1) {
      effectiveTier = 'basic';
    }

    // Check if user has any membership (paid subscription OR free tier from listing tools)
    const hasMembership = hasPaidTier || userProfile.tools_count >= 1;

    if (!hasMembership) {
      return NextResponse.json(
        {
          error: 'No membership found',
          reason: 'no_membership',
          message: 'You need membership to borrow. Subscribe to a plan or list tools.',
          suggestedActions: [
            'Subscribe to Basic (£2/mo)',
            'List 1 tool to unlock Basic free',
            'List 3 tools to unlock Standard free',
          ],
        },
        { status: 403 }
      );
    }

    // Get tool info
    const { data: tool } = await supabase
      .from('tools')
      .select('id, tool_value, available, owner_id')
      .eq('id', toolId)
      .single();

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Check if tool is available for borrowing
    if (!tool.available) {
      return NextResponse.json(
        {
          error: 'Tool not available',
          reason: 'tool_unavailable',
          message: 'This tool is currently unavailable for borrowing',
        },
        { status: 403 }
      );
    }

    // Prevent user from borrowing their own tool
    if (tool.owner_id === session.user.id) {
      return NextResponse.json(
        {
          error: 'Cannot borrow own tool',
          reason: 'self_borrow',
          message: 'You cannot borrow a tool you own',
        },
        { status: 403 }
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
      const upgradeSuggestion = effectiveTier === 'basic' ? 'Standard (2 borrows)' : 'Pro (5 borrows)';
      return NextResponse.json(
        {
          error: `You've reached your borrow limit`,
          reason: 'borrow_limit_reached',
          message: `You have ${activeBorrowCount} active borrow${activeBorrowCount !== 1 ? 's' : ''} (your limit is ${limits.maxBorrows})`,
          tier: effectiveTier,
          currentBorrows: activeBorrowCount,
          maxBorrows: limits.maxBorrows,
          suggestedAction: `Upgrade to ${upgradeSuggestion} or wait for a borrow to complete`,
        },
        { status: 403 }
      );
    }

    // Check tool value
    if (tool.tool_value > limits.maxValue) {
      const upgradeSuggestion = effectiveTier === 'basic' ? 'Standard (£300)' : 'Pro (£1,000)';
      return NextResponse.json(
        {
          error: `Tool value exceeds your limit`,
          reason: 'value_limit_exceeded',
          message: `This tool is worth £${tool.tool_value}, but your limit is £${limits.maxValue}`,
          tier: effectiveTier,
          toolValue: tool.tool_value,
          userValueLimit: limits.maxValue,
          suggestedAction: `Upgrade to ${upgradeSuggestion} to borrow this tool`,
        },
        { status: 403 }
      );
    }

    // Check duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (durationDays > limits.maxDays) {
      const upgradeSuggestion = effectiveTier === 'basic' ? 'Standard (7 days)' : 'Pro (14 days)';
      return NextResponse.json(
        {
          error: `Requested duration exceeds your limit`,
          reason: 'duration_exceeds_limit',
          message: `You requested ${durationDays} days, but your limit is ${limits.maxDays} days`,
          tier: effectiveTier,
          requestedDays: durationDays,
          maxDays: limits.maxDays,
          suggestedAction: `Shorten your request to ${limits.maxDays} days, or upgrade to ${upgradeSuggestion}`,
        },
        { status: 403 }
      );
    }

    // Create borrow request
    const { data: borrowRequest, error: createError } = await supabase
      .from('borrow_requests')
      .insert({
        user_id: session.user.id,
        tool_id: toolId,
        start_date: startDate,
        end_date: endDate,
        notes: notes || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating borrow request:', createError);
      return NextResponse.json({ error: 'Error creating borrow request' }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Borrow request created successfully',
        request: borrowRequest,
        tier: effectiveTier,
        tierSource: userProfile.tools_count >= 1 ? 'contribution' : 'subscription',
        limits: limits,
        toolValue: tool.tool_value,
        withinLimits: true,
        protectionActive: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Borrow request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
