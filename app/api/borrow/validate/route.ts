import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getSupabase } from '@/lib/supabase';

/**
 * Validate if user can borrow a tool in the rental model
 * This endpoint checks:
 * - User is authenticated
 * - Tool exists and is available for rental
 * - Calculate rental cost (daily rate × duration)
 * 
 * NEW: No subscription required - anyone can rent by paying per day
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'not_authenticated',
          message: 'You must be signed in to rent tools',
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

    // Get user profile for basic checks
    const sb = getSupabase();
    const { data: userProfile } = await sb
      .from('users_ext')
      .select('id')
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

    // Get tool info including rental price
    const { data: tool } = await sb
      .from('tools')
      .select('id, owner_id, tool_value, condition')
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

    // Prevent borrowing own tools
    if (tool.owner_id === session.user.id) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'cannot_borrow_own_tool',
          message: 'You cannot rent your own tools',
        },
        { status: 403 }
      );
    }

    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (durationDays < 1) {
      return NextResponse.json(
        {
          canBorrow: false,
          reason: 'invalid_duration',
          message: 'Rental duration must be at least 1 day',
        },
        { status: 400 }
      );
    }

    // Calculate rental cost
    const dailyRate = tool.tool_value || 3; // Default £3/day if not set
    const rentalCost = dailyRate * durationDays;
    const totalCost = rentalCost;

    // All checks passed - user can proceed to payment
    return NextResponse.json(
      {
        canBorrow: true,
        tool: {
          id: toolId,
          dailyRate,
          durationDays,
          rentalCost: parseFloat(rentalCost.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
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
