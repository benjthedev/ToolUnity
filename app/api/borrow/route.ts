import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getSupabase } from '@/lib/supabase';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { BorrowRequestSchema } from '@/lib/validation';
import { serverLog } from '@/lib/logger';
import { ApiErrors } from '@/lib/api-response';
import { ZodError } from 'zod';

/**
 * NEW RENTAL MODEL: Create a rental request
 * 
 * This endpoint now handles:
 * - Verify user authentication (no membership required anymore!)
 * - Validate tool exists and owner isn't same as borrower
 * - Calculate rental cost (daily rate × duration + protection fee)
 * - Create a rental_transactions record
 * - Return payment details for Stripe checkout
 * 
 * Payment is processed BEFORE the rental is confirmed
 * (70% goes to owner, 30% to platform for protection + operations)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return ApiErrors.CSRF_FAILED();
    }

    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return ApiErrors.UNAUTHORIZED();
    }

    // Rate limit rental requests (20 per hour per user - more permissive than before)
    const rateLimitCheck = checkRateLimitByUserId(
      session.user.id,
      20, // maxAttempts
      60 * 60 * 1000 // windowMs (1 hour)
    );

    if (!rateLimitCheck.allowed) {
      return ApiErrors.RATE_LIMITED();
    }

    const body = await request.json();
    const { toolId, startDate, endDate, notes } = body;

    // Validate input with Zod
    try {
      BorrowRequestSchema.parse({
        tool_id: toolId,
        start_date: startDate,
        end_date: endDate,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiErrors.VALIDATION_ERROR('Invalid rental request data');
      }
      throw error;
    }

    // Get user profile
    const sb = getSupabase();
    const { data: userProfile } = await sb
      .from('users_ext')
      .select('stripe_customer_id, email')
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

    // Get tool info including daily rental rate
    const { data: tool } = await sb
      .from('tools')
      .select('id, owner_id, daily_rental_rate, description')
      .eq('id', toolId)
      .single();

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Prevent user from borrowing their own tool
    if (tool.owner_id === session.user.id) {
      return NextResponse.json(
        {
          error: 'Cannot rent own tool',
          reason: 'self_borrow',
          message: 'You cannot rent a tool you own',
        },
        { status: 403 }
      );
    }

    // Check for date overlap with existing active rentals
    const { data: existingRentals } = await sb
      .from('rental_transactions')
      .select('id, start_date, end_date, status')
      .eq('tool_id', toolId)
      .in('status', ['pending_payment', 'active', 'confirmed']);

    if (existingRentals && existingRentals.length > 0) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (const existing of existingRentals) {
        const existingStart = new Date(existing.start_date);
        const existingEnd = new Date(existing.end_date);

        // Check if date ranges overlap
        if (start < existingEnd && end > existingStart) {
          return NextResponse.json(
            {
              error: 'Tool not available for those dates',
              reason: 'date_conflict',
              message: `This tool is already rented from ${existingStart.toDateString()} to ${existingEnd.toDateString()}`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Calculate duration and cost
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (durationDays < 1) {
      return NextResponse.json(
        { error: 'Rental duration must be at least 1 day' },
        { status: 400 }
      );
    }

    // Calculate costs
    const dailyRate = tool.daily_rental_rate || 3; // Default £3/day
    const rentalCost = parseFloat((dailyRate * durationDays).toFixed(2));
    const platformFee = parseFloat((rentalCost * 0.30).toFixed(2)); // Platform takes 30%
    const ownerPayout = parseFloat((rentalCost * 0.70).toFixed(2)); // Owner gets 70%
    const totalCost = rentalCost;

    // Create rental transaction record (status: pending_payment)
    const { data: rentalTransaction, error: createError } = await sb
      .from('rental_transactions')
      .insert({
        borrower_id: session.user.id,
        tool_id: toolId,
        owner_id: tool.owner_id,
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        daily_rate: dailyRate,
        rental_cost: rentalCost,
        platform_fee: platformFee,
        owner_payout: ownerPayout,
        total_cost: totalCost,
        status: 'pending_payment', // Waiting for Stripe payment
        notes: notes || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating rental transaction:', createError);
      return NextResponse.json({ error: 'Error processing rental request' }, { status: 500 });
    }

    // Return rental details for Stripe checkout
    return NextResponse.json(
      {
        message: 'Rental request created - proceed to payment',
        rentalId: rentalTransaction.id,
        tool: {
          id: toolId,
          dailyRate: dailyRate,
        },
        pricing: {
          durationDays,
          rentalCost,
          totalCost,
          breakdown: {
            youPay: totalCost,
            ownerGets: ownerPayout,
            platformGets: platformFee,
          },
        },
        stripeMetadata: {
          rentalTransactionId: rentalTransaction.id,
          borrowerId: session.user.id,
          ownerId: tool.owner_id,
          toolId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Rental request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
