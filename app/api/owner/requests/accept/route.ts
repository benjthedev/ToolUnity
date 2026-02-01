import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { checkRateLimitByUserId } from '@/lib/rate-limit';

/**
 * POST /api/owner/requests/accept
 * Accept a rental request (owner only)
 * 
 * Protected by:
 * - Authentication
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

    // Step 2: Rate limiting
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

    const body = await request.json();
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
        renter_id,
        status,
        tool_id,
        start_date,
        end_date,
        duration_days,
        rental_cost,
        owner_payout,
        stripe_payment_intent_id,
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

    // Step 6: Send email notification to renter
    try {
      // Get renter and owner details
      const { data: renterData } = await supabase
        .from('users_ext')
        .select('email, username')
        .eq('user_id', rental.renter_id)
        .single();

      const { data: ownerData } = await supabase
        .from('users_ext')
        .select('email, phone_number, username')
        .eq('user_id', rental.owner_id)
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
            subject: `Your rental request for ${toolName} has been accepted!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Good news! Your rental has been approved 🎉</h2>
                <p>The owner has accepted your request to rent <strong>${toolName}</strong>.</p>
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                  <h3 style="margin-top: 0; color: #166534;">Rental Details:</h3>
                  <p><strong>Tool:</strong> ${toolName}</p>
                  <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
                  <p><strong>Duration:</strong> ${rental.duration_days} day${rental.duration_days > 1 ? 's' : ''}</p>
                </div>
                
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                  <h3 style="margin-top: 0; color: #1e40af;">Owner Contact Details:</h3>
                  ${ownerData?.username ? `<p><strong>Name:</strong> ${ownerData.username}</p>` : ''}
                  <p><strong>Email:</strong> <a href="mailto:${ownerData?.email}">${ownerData?.email}</a></p>
                  ${ownerData?.phone_number ? `<p><strong>Phone:</strong> <a href="tel:${ownerData.phone_number}">${ownerData.phone_number}</a></p>` : ''}
                </div>
                
                <p><strong>Next step:</strong> Contact the owner to arrange pickup of the tool.</p>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                  View in Dashboard →
                </a>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
              </div>
            `,
          }),
        });
      }
    } catch (emailError) {
      console.error('Error sending acceptance email:', emailError);
      // Don't fail the request if email fails
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
