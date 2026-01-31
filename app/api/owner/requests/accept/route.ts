import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { validateCsrfTokenString } from '@/lib/csrf';

/**
 * POST /api/owner/requests/accept
 * Accept a rental request (owner only)
 * 
 * Protected by:
 * - Authentication
 * - CSRF token validation
 * - Rate limiting (20/hour per user)
 * - Ownership verification
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Step 2: Validate CSRF token
    const body = await request.json();
    const csrfToken = body.csrf_token;
    
    if (!csrfToken || !validateCsrfTokenString(csrfToken, request)) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    // Step 3: Rate limiting
    const rateLimitCheck = checkRateLimitByUserId(
      session.user.id,
      20,
      3600000 // 1 hour
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { rental_id } = body;

    if (!rental_id) {
      return NextResponse.json(
        { error: 'Missing rental_id' },
        { status: 400 }
      );
    }

    // Step 4: Fetch rental and verify ownership
    const { data: rental, error: fetchError } = await supabase
      .from('rental_transactions')
      .select(`
        id,
        owner_id,
        status,
        tool_id,
        tools:tool_id (
          owner_id
        )
      `)
      .eq('id', rental_id)
      .single();

    if (fetchError || !rental) {
      return NextResponse.json(
        { error: 'Rental request not found' },
        { status: 404 }
      );
    }

    // Verify the tool owner is the one accepting
    if (rental.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this tool' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (rental.status !== 'pending_approval') {
      return NextResponse.json(
        { error: `Request already ${rental.status}` },
        { status: 400 }
      );
    }

    // Step 5: Update rental status to active
    const { error: updateError } = await supabase
      .from('rental_transactions')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
      })
      .eq('id', rental_id);

    if (updateError) {
      console.error('Error accepting rental:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept rental request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Rental request accepted. Contact information is now shared with the renter.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Accept rental error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
