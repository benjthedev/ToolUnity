import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { DEPOSIT_AMOUNT, DEPOSIT_STATUS, CLAIM_WINDOW_DAYS } from '@/lib/deposit-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/cron/auto-release-deposits
 * Automatically refund deposits where the claim window has expired without a claim
 * 
 * Runs daily at 7am UTC via Vercel Cron
 * Protected by CRON_SECRET
 * 
 * Logic:
 * 1. Find all returned rentals where deposit_status is 'held' or 'pending_release'
 * 2. Check if claim_window_ends_at has passed
 * 3. Issue partial refund via Stripe (only the deposit amount, not the rental)
 * 4. Update deposit_status to 'released'
 * 5. Email the renter about their refund
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const now = new Date();

    // Find deposits eligible for auto-release:
    // - Status is 'returned' 
    // - deposit_status is 'held' or 'pending_release'
    // - claim_window_ends_at has passed
    const { data: eligibleRentals, error: fetchError } = await supabase
      .from('rental_transactions')
      .select(`
        id,
        renter_id,
        owner_id,
        tool_id,
        deposit_amount,
        deposit_status,
        claim_window_ends_at,
        stripe_payment_intent_id,
        tools:tool_id(name)
      `)
      .eq('status', 'returned')
      .in('deposit_status', [DEPOSIT_STATUS.HELD, DEPOSIT_STATUS.PENDING_RELEASE])
      .lt('claim_window_ends_at', now.toISOString());

    if (fetchError) {
      console.error('Error fetching eligible deposits:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 });
    }

    if (!eligibleRentals || eligibleRentals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No deposits to release',
        processed: 0,
      });
    }

    const results = {
      processed: 0,
      refunded: 0,
      errors: [] as string[],
    };

    for (const rental of eligibleRentals) {
      try {
        const depositAmount = rental.deposit_amount || DEPOSIT_AMOUNT;
        let depositRefundId = null;

        // Issue partial refund for just the deposit amount
        if (rental.stripe_payment_intent_id) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: rental.stripe_payment_intent_id,
              amount: Math.round(depositAmount * 100), // Partial refund in pence
              reason: 'requested_by_customer',
              metadata: {
                rental_id: rental.id,
                type: 'deposit_auto_release',
                reason: `Auto-released: No damage claimed within ${CLAIM_WINDOW_DAYS} day window`,
              },
            });
            depositRefundId = refund.id;
            results.refunded++;
          } catch (stripeError: any) {
            console.error(`Stripe deposit refund failed for rental ${rental.id}:`, stripeError);
            results.errors.push(`Deposit refund failed for rental ${rental.id}: ${stripeError.message}`);
            continue;
          }
        }

        // Update deposit status
        const { error: updateError } = await supabase
          .from('rental_transactions')
          .update({
            deposit_status: DEPOSIT_STATUS.RELEASED,
            deposit_released_at: now.toISOString(),
            deposit_refund_id: depositRefundId,
          })
          .eq('id', rental.id);

        if (updateError) {
          console.error(`Error updating deposit for rental ${rental.id}:`, updateError);
          results.errors.push(`Update failed for rental ${rental.id}`);
          continue;
        }

        // Send email to renter about deposit refund
        try {
          const { data: renterData } = await supabase
            .from('users_ext')
            .select('email, username')
            .eq('user_id', rental.renter_id)
            .single();

          if (renterData?.email) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const toolName = (rental as any).tools?.name || 'the tool';

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'ToolUnity <noreply@toolunity.co.uk>',
                to: renterData.email,
                subject: `Your £${depositAmount.toFixed(2)} deposit has been refunded`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #16a34a;">Your deposit has been refunded! 🎉</h2>
                    <p>Great news! The ${CLAIM_WINDOW_DAYS}-day inspection window for <strong>${toolName}</strong> has passed with no issues reported.</p>
                    
                    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                      <h3 style="margin-top: 0; color: #166534;">💳 Deposit Refunded</h3>
                      <p style="margin-bottom: 0;">Your <strong>£${depositAmount.toFixed(2)}</strong> security deposit has been refunded to your original payment method. It should appear within 5-10 business days.</p>
                    </div>
                    
                    <p>Thanks for renting on ToolUnity! We hope it went well.</p>
                    
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
          console.error(`Email error for rental ${rental.id}:`, emailError);
          // Don't fail the whole process
        }

        results.processed++;
      } catch (error) {
        console.error(`Error processing deposit for rental ${rental.id}:`, error);
        results.errors.push(`Processing failed for rental ${rental.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} deposit refunds`,
      ...results,
    });
  } catch (error) {
    console.error('Auto-release deposits cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
