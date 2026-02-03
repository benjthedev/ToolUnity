import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

/**
 * GET /api/cron/auto-decline-rentals
 * Automatically decline pending rental requests older than 48 hours and refund renters
 * 
 * This endpoint is called by Vercel Cron (daily at 6am UTC)
 * Protected by CRON_SECRET to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate 48 hours ago
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find all pending_approval rentals older than 48 hours
    const { data: expiredRentals, error: fetchError } = await supabase
      .from('rental_transactions')
      .select(`
        id,
        owner_id,
        renter_id,
        stripe_payment_intent_id,
        total_cost,
        tool_id,
        start_date,
        end_date,
        created_at,
        tools:tool_id (
          name
        )
      `)
      .eq('status', 'pending_approval')
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error('Error fetching expired rentals:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch expired rentals' },
        { status: 500 }
      );
    }

    if (!expiredRentals || expiredRentals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired rental requests found',
        processed: 0,
      });
    }

    const results = {
      processed: 0,
      refunded: 0,
      errors: [] as string[],
    };

    // Process each expired rental
    for (const rental of expiredRentals) {
      try {
        // Issue refund
        let refundId = null;
        if (rental.stripe_payment_intent_id) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: rental.stripe_payment_intent_id,
              reason: 'requested_by_customer',
              metadata: {
                rental_id: rental.id,
                auto_declined: 'true',
                reason: 'Owner did not respond within 48 hours',
              },
            });
            refundId = refund.id;
            results.refunded++;
          } catch (stripeError: any) {
            console.error(`Stripe refund failed for rental ${rental.id}:`, stripeError);
            results.errors.push(`Refund failed for rental ${rental.id}: ${stripeError.message}`);
            continue; // Skip this rental if refund fails
          }
        }

        // Update rental status to auto_declined
        const { error: updateError } = await supabase
          .from('rental_transactions')
          .update({
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejection_reason: 'Auto-declined: Owner did not respond within 48 hours',
            refund_id: refundId,
          })
          .eq('id', rental.id);

        if (updateError) {
          console.error(`Error updating rental ${rental.id}:`, updateError);
          results.errors.push(`Update failed for rental ${rental.id}`);
          continue;
        }

        // Send email notification to renter
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
                subject: `Your rental request for ${toolName} has expired`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f59e0b;">Your rental request has expired</h2>
                    <p>Unfortunately, the owner didn't respond to your request to rent <strong>${toolName}</strong> for ${startDate} to ${endDate} within 48 hours.</p>
                    
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
          }
        } catch (emailError) {
          console.error(`Error sending email for rental ${rental.id}:`, emailError);
          // Don't fail the whole process if email fails
        }

        results.processed++;
      } catch (error) {
        console.error(`Error processing rental ${rental.id}:`, error);
        results.errors.push(`Processing failed for rental ${rental.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} expired rental requests`,
      ...results,
    });
  } catch (error) {
    console.error('Auto-decline cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
