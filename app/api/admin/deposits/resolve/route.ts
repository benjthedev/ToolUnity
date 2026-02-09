import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { DEPOSIT_STATUS } from '@/lib/deposit-config';

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

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
 * POST /api/admin/deposits/resolve
 * Admin resolves a deposit claim
 * 
 * Actions:
 * - 'refund': Refund deposit to renter (no damage confirmed)
 * - 'forfeit': Keep deposit (damage confirmed, goes to platform for owner compensation)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rental_id, action, admin_notes } = body;

    if (!rental_id || !action) {
      return NextResponse.json({ error: 'Missing rental_id or action' }, { status: 400 });
    }

    if (!['refund', 'forfeit'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "refund" or "forfeit"' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get the rental
    const { data: rental, error: fetchError } = await supabase
      .from('rental_transactions')
      .select(`
        id,
        renter_id,
        owner_id,
        deposit_amount,
        deposit_status,
        stripe_payment_intent_id,
        tool_id,
        tools:tool_id(name)
      `)
      .eq('id', rental_id)
      .single();

    if (fetchError || !rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Only resolve claimed deposits
    if (rental.deposit_status !== DEPOSIT_STATUS.CLAIMED) {
      return NextResponse.json(
        { error: `Cannot resolve - deposit status is: ${rental.deposit_status}` },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolName = (rental as any).tools?.name || 'the tool';
    const depositAmount = rental.deposit_amount || 10;
    let depositRefundId = null;

    if (action === 'refund') {
      // Refund the deposit to renter
      if (rental.stripe_payment_intent_id) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: rental.stripe_payment_intent_id,
            amount: Math.round(depositAmount * 100), // Partial refund in pence
            reason: 'requested_by_customer',
            metadata: {
              rental_id: rental.id,
              type: 'deposit_admin_refund',
              admin_notes: admin_notes || 'Admin resolved claim - deposit refunded',
            },
          });
          depositRefundId = refund.id;
        } catch (stripeError: any) {
          console.error('Stripe deposit refund failed:', stripeError);
          return NextResponse.json(
            { error: `Refund failed: ${stripeError.message}` },
            { status: 500 }
          );
        }
      }

      // Update status
      await supabase
        .from('rental_transactions')
        .update({
          deposit_status: DEPOSIT_STATUS.REFUNDED,
          deposit_released_at: new Date().toISOString(),
          deposit_refund_id: depositRefundId,
          deposit_admin_notes: admin_notes || 'Claim reviewed - no damage confirmed, deposit refunded',
        })
        .eq('id', rental_id);

      // Email renter
      try {
        const { data: renterData } = await supabase
          .from('users_ext')
          .select('email')
          .eq('user_id', rental.renter_id)
          .single();

        if (renterData?.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ToolUnity <noreply@toolunity.co.uk>',
              to: renterData.email,
              subject: `Good news - Your £${depositAmount.toFixed(2)} deposit for ${toolName} has been refunded`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #16a34a;">Deposit Claim Resolved - Refund Issued 🎉</h2>
                  <p>We've reviewed the damage claim for <strong>${toolName}</strong> and found no evidence of damage beyond normal wear.</p>
                  
                  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                    <h3 style="margin-top: 0; color: #166534;">💳 Deposit Refunded</h3>
                    <p style="margin-bottom: 0;">Your <strong>£${depositAmount.toFixed(2)}</strong> deposit has been refunded. It should appear within 5-10 business days.</p>
                  </div>
                  
                  ${admin_notes ? `<p style="color: #6b7280; font-size: 14px;">Admin note: ${admin_notes}</p>` : ''}
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
                </div>
              `,
            }),
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      // Email owner about decision
      try {
        const { data: ownerData } = await supabase
          .from('users_ext')
          .select('email')
          .eq('user_id', rental.owner_id)
          .single();

        if (ownerData?.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ToolUnity <noreply@toolunity.co.uk>',
              to: ownerData.email,
              subject: `Deposit claim update for ${toolName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Deposit Claim Review Complete</h2>
                  <p>We've reviewed your damage claim for <strong>${toolName}</strong>.</p>
                  <p>After investigation, we determined the deposit should be refunded to the renter. If you disagree, please contact us at <a href="mailto:support@toolunity.co.uk">support@toolunity.co.uk</a> with any additional evidence.</p>
                  ${admin_notes ? `<p style="color: #6b7280; font-size: 14px;">Note: ${admin_notes}</p>` : ''}
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
                </div>
              `,
            }),
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: `Deposit of £${depositAmount.toFixed(2)} refunded to renter`,
        action: 'refunded',
        refund_id: depositRefundId,
      });

    } else if (action === 'forfeit') {
      // Keep the deposit (damage confirmed)
      await supabase
        .from('rental_transactions')
        .update({
          deposit_status: DEPOSIT_STATUS.FORFEITED,
          deposit_admin_notes: admin_notes || 'Claim reviewed - damage confirmed, deposit forfeited',
        })
        .eq('id', rental_id);

      // Email renter
      try {
        const { data: renterData } = await supabase
          .from('users_ext')
          .select('email')
          .eq('user_id', rental.renter_id)
          .single();

        if (renterData?.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ToolUnity <noreply@toolunity.co.uk>',
              to: renterData.email,
              subject: `Deposit decision for ${toolName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">Deposit Claim Resolved</h2>
                  <p>After reviewing the damage claim for <strong>${toolName}</strong>, we have determined that damage occurred during your rental.</p>
                  
                  <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                    <p style="margin: 0;">Your <strong>£${depositAmount.toFixed(2)}</strong> deposit will be retained to compensate the tool owner for the damage.</p>
                  </div>
                  
                  ${admin_notes ? `<p style="color: #6b7280; font-size: 14px;">Note: ${admin_notes}</p>` : ''}
                  
                  <p>If you disagree with this decision, please contact us at <a href="mailto:support@toolunity.co.uk">support@toolunity.co.uk</a>.</p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
                </div>
              `,
            }),
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      // Email owner about approval
      try {
        const { data: ownerData } = await supabase
          .from('users_ext')
          .select('email')
          .eq('user_id', rental.owner_id)
          .single();

        if (ownerData?.email) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ToolUnity <noreply@toolunity.co.uk>',
              to: ownerData.email,
              subject: `Deposit claim approved for ${toolName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #16a34a;">Your Damage Claim Was Approved ✓</h2>
                  <p>We've confirmed the damage to <strong>${toolName}</strong> reported during the rental.</p>
                  
                  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                    <p style="margin: 0;">The renter's <strong>£${depositAmount.toFixed(2)}</strong> deposit has been retained as compensation. We'll process your payout shortly.</p>
                  </div>
                  
                  ${admin_notes ? `<p style="color: #6b7280; font-size: 14px;">Note: ${admin_notes}</p>` : ''}
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
                </div>
              `,
            }),
          });
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: `Deposit of £${depositAmount.toFixed(2)} forfeited - retained for owner compensation`,
        action: 'forfeited',
      });
    }
  } catch (error) {
    console.error('Admin deposit resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
