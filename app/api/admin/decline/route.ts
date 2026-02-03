import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { rentalId, reason } = body;

    if (!rentalId) {
      return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 });
    }

    // Get the rental details
    const supabaseAdmin = getSupabaseAdmin();
    const { data: rental, error: rentalError } = await supabaseAdmin
      .from('rental_transactions')
      .select(`
        *,
        tools:tool_id(id, name),
        renter:renter_id(id, email, username),
        owner:owner_id(id, email, username)
      `)
      .eq('id', rentalId)
      .single();

    if (rentalError || !rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const tool = rental.tools;
    const borrower = rental.renter;

    if (rental.status !== 'pending_approval') {
      return NextResponse.json({ 
        error: 'Only pending rentals can be declined' 
      }, { status: 400 });
    }

    // Issue refund via Stripe
    if (rental.stripe_payment_intent_id) {
      try {
        console.log('Attempting refund for payment intent:', rental.stripe_payment_intent_id);
        const refund = await stripe.refunds.create({
          payment_intent: rental.stripe_payment_intent_id,
          reason: 'requested_by_customer',
          metadata: {
            rental_id: rentalId,
            decline_reason: reason || 'Declined by administrator',
          },
        });
        console.log(`Refund issued successfully:`, refund.id);
      } catch (refundError: any) {
        // Check if the charge was already refunded
        if (refundError.message.includes('already been refunded')) {
          console.log('Charge already refunded, proceeding with status update');
        } else {
          console.error('Stripe refund failed:', refundError.message);
          return NextResponse.json({ 
            error: `Failed to issue refund: ${refundError.message}` 
          }, { status: 500 });
        }
      }
    } else {
      console.log('No stripe_payment_intent_id found for rental:', rentalId);
    }

    // Update rental status
    const { error: updateError } = await supabaseAdmin
      .from('rental_transactions')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Declined by administrator',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rentalId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: `Failed to update rental status: ${updateError.message}` }, { status: 500 });
    }

    // Send notification email to borrower
    const borrowerEmail = borrower?.email;
    const borrowerName = borrower?.username || borrower?.email?.split('@')[0] || 'there';
    const toolName = tool?.name || 'the tool';

    if (borrowerEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'ToolUnity <noreply@toolunity.co.uk>',
            to: borrowerEmail,
            subject: 'Rental Request Declined - Refund Issued',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Rental Request Declined</h1>
                  </div>
                  
                  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                    <p>Hi ${borrowerName},</p>
                    
                    <p>Unfortunately, your rental request for <strong>${toolName}</strong> has been declined.</p>
                    
                    <p><strong>Reason:</strong> ${reason || 'Declined by administrator'}</p>
                    
                    <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #065f46;"><strong>✓ Full refund issued</strong></p>
                      <p style="margin: 5px 0 0 0; color: #065f46; font-size: 14px;">Your refund of £${(rental.rental_cost).toFixed(2)} will appear in your account within 5-10 business days.</p>
                    </div>
                    
                    <p>Don't worry - there are plenty of other tools available on ToolUnity!</p>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/tools" 
                       style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                      Browse More Tools →
                    </a>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
                  </div>
                </body>
              </html>
            `,
          }),
        });
        console.log(`Decline notification sent to ${borrowerEmail}`);
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Rental declined and refund issued' 
    });
  } catch (error) {
    console.error('Admin decline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
