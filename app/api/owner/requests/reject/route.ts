import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { validateCsrfTokenString } from '@/lib/csrf';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

/**
 * POST /api/owner/requests/reject
 * Reject a rental request and issue refund (owner only)
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

    const { rental_id, reason } = body;

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
        renter_id,
        status,
        tool_id,
        start_date,
        end_date,
        stripe_payment_intent_id,
        total_cost,
        tools:tool_id (
          owner_id,
          name
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

    // Verify the tool owner is the one rejecting
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

    // Step 5: Issue Stripe refund
    let refundId = null;
    if (rental.stripe_payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: rental.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: {
            rental_id: rental_id,
            rejection_reason: reason || 'Tool owner declined rental request',
          },
        });
        refundId = refund.id;
        console.log(`Refund issued: ${refundId} for rental ${rental_id}`);
      } catch (stripeError: any) {
        console.error('Stripe refund failed:', stripeError);
        // Continue with rejection even if refund fails - log for manual processing
        return NextResponse.json(
          { 
            error: 'Failed to process refund. Please contact support.',
            details: stripeError.message 
          },
          { status: 500 }
        );
      }
    }

    // Step 6: Update rental status to rejected
    const { error: updateError } = await supabase
      .from('rental_transactions')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'Tool owner declined request',
        refund_id: refundId,
      })
      .eq('id', rental_id);

    if (updateError) {
      console.error('Error rejecting rental:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject rental request' },
        { status: 500 }
      );
    }

    // Step 7: Send email notification to renter
    try {
      const { data: renterData } = await supabase
        .from('users_ext')
        .select('email')
        .eq('user_id', rental.renter_id)
        .single();

      if (renterData?.email) {
        const toolName = rental.tools?.name || 'the tool';
        const startDate = new Date(rental.start_date).toLocaleDateString('en-GB');
        const endDate = new Date(rental.end_date).toLocaleDateString('en-GB');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ToolUnity <noreply@toolunity.co.uk>',
            to: renterData.email,
            subject: `Rental request for ${toolName} was declined`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Unfortunately, your rental request was declined</h2>
                <p>The owner was unable to accept your request to rent <strong>${toolName}</strong> for ${startDate} to ${endDate}.</p>
                
                ${reason ? `
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                  <p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>
                </div>
                ` : ''}
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                  <h3 style="margin-top: 0; color: #166534;">💳 Full Refund Issued</h3>
                  <p style="margin-bottom: 0;">Don't worry - we've issued a full refund of <strong>£${rental.total_cost.toFixed(2)}</strong> to your original payment method. It should appear within 5-10 business days.</p>
                </div>
                
                <p>Don't give up! There are plenty of other tools available on ToolUnity.</p>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/tools" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                  Browse More Tools →
                </a>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
              </div>
            `,
          }),
        });
        console.log(`Sent rejection email to renter: ${renterData.email}`);
      }
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Rental request rejected. Refund has been issued to the renter.',
        refund_id: refundId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reject rental error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
