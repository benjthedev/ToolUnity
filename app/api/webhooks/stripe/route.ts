export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { serverLog } from '@/lib/logger';

let stripe: Stripe | null = null;
let supabase: any = null;

function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }
  return stripe;
}

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabase;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  // In development, allow skipping signature if secret not configured
  // But in production, ALWAYS require signature verification
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  if (isDevelopment && !hasSecret) {
    // Development without secret: allow unsigned events from Stripe CLI
    try {
      event = JSON.parse(body) as Stripe.Event;
      serverLog.debug('Development mode: Skipping signature verification (no secret configured)');
    } catch (error) {
      serverLog.error('Failed to parse webhook body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  } else {
    // Production OR development with secret: require signature verification
    if (!sig) {
      serverLog.error('Webhook missing signature - rejecting unsigned event');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!hasSecret) {
      serverLog.error('CRITICAL: Webhook signature required but STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook signature verification failed - server misconfiguration' },
        { status: 500 }
      );
    }

    try {
      event = getStripe().webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      serverLog.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a rental payment (one-time) or subscription
        const metadata = session.metadata || {};
        
        if (metadata.type === 'rental_payment' && metadata.rental_transaction_id) {
          // Handle rental payment completion
          const rentalId = metadata.rental_transaction_id;
          
          const { error: updateError } = await getSupabase()
            .from('rental_transactions')
            .update({
              status: 'pending_approval',
              payment_completed_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq('id', rentalId);
          
          if (updateError) {
            serverLog.error('Error updating rental transaction:', updateError);
          } else {
            serverLog.info(`Rental ${rentalId} payment completed - status set to pending_approval (awaiting owner approval)`);
            
            // Send email notification to tool owner
            try {
              // Get rental details including owner and tool info
              const { data: rentalData } = await getSupabase()
                .from('rental_transactions')
                .select(`
                  id,
                  start_date,
                  end_date,
                  duration_days,
                  rental_cost,
                  owner_id,
                  tools:tool_id(name),
                  renter:renter_id(email, username)
                `)
                .eq('id', rentalId)
                .single();
              
              if (rentalData) {
                // Get owner's email
                const { data: ownerData } = await getSupabase()
                  .from('users_ext')
                  .select('email, username')
                  .eq('user_id', rentalData.owner_id)
                  .single();
                
                if (ownerData?.email) {
                  const toolName = rentalData.tools?.name || 'your tool';
                  const renterEmail = rentalData.renter?.email || 'A user';
                  const startDate = new Date(rentalData.start_date).toLocaleDateString('en-GB');
                  const endDate = new Date(rentalData.end_date).toLocaleDateString('en-GB');
                  const ownerEarning = (rentalData.rental_cost * 0.85).toFixed(2);
                  
                  // Send email via Resend
                  const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: 'ToolUnity <noreply@toolunity.co.uk>',
                      to: ownerData.email,
                      subject: `New Rental Request for ${toolName}`,
                      html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <h2 style="color: #2563eb;">Someone wants to rent your tool!</h2>
                          <p>Good news! You've received a rental request for <strong>${toolName}</strong>.</p>
                          
                          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Rental Details:</h3>
                            <p><strong>Tool:</strong> ${toolName}</p>
                            <p><strong>Dates:</strong> ${startDate} to ${endDate}</p>
                            <p><strong>Duration:</strong> ${rentalData.duration_days} day${rentalData.duration_days > 1 ? 's' : ''}</p>
                            <p><strong>You'll earn:</strong> £${ownerEarning} (85% of rental)</p>
                          </div>
                          
                          <p><strong>Action required:</strong> Log in to your dashboard to accept or decline this request.</p>
                          
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                            View Request →
                          </a>
                          
                          <p style="color: #dc2626; font-size: 14px; font-weight: bold;">⚠️ If you don't respond within 48 hours, the rental will be automatically declined and the renter will be refunded.</p>
                          
                          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                          <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
                        </div>
                      `,
                    }),
                  });
                  
                  if (emailResponse.ok) {
                    serverLog.info(`Sent rental notification email to owner: ${ownerData.email}`);
                  } else {
                    serverLog.error('Failed to send owner notification email:', await emailResponse.text());
                  }
                }
              }
            } catch (emailError) {
              serverLog.error('Error sending owner notification email:', emailError);
              // Don't fail the webhook if email fails
            }
          }
          break;
        }
        
        // Legacy: Handle subscription payments (for backwards compatibility)
        if (session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );
          
          // Update user tier based on price ID (legacy subscription model)
          const priceId = subscription.items.data[0].price.id;
          let tier = 'none';
          
          if (priceId === process.env.STRIPE_PRICE_BASIC) {
            tier = 'basic';
          } else if (priceId === process.env.STRIPE_PRICE_STANDARD) {
            tier = 'standard';
          } else if (priceId === process.env.STRIPE_PRICE_PRO) {
            tier = 'pro';
          }
          
          // Update the user's subscription tier
          const { error } = await getSupabase()
            .from('users_ext')
            .update({
              subscription_tier: tier,
              trial_used: true,
            })
            .eq('user_id', session.client_reference_id);
          
          if (error) {
            serverLog.error('Error updating user tier:', error);
          } else {
            serverLog.info(`Updated user ${session.client_reference_id} to tier: ${tier}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        // Subscription updates are handled via checkout.session.completed
        serverLog.debug('Subscription updated - handled via checkout.session.completed');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the customer to find their email
        const customer = await getStripe().customers.retrieve(subscription.customer as string);
        
        if (customer && 'email' in customer && customer.email) {
          // Find the user by email and reset their tier to 'none'
          const { data, error: selectError } = await getSupabase()
            .from('users_ext')
            .select('user_id')
            .eq('email', customer.email)
            .single();
          
          if (selectError) {
            serverLog.error('Error finding user by email:', selectError);
            break;
          }
          
          if (data) {
            const { error: updateError } = await getSupabase()
              .from('users_ext')
              .update({
                subscription_tier: 'none',
              })
              .eq('user_id', data.user_id);
            
            if (updateError) {
              serverLog.error('Error resetting user tier:', updateError);
            } else {
              serverLog.info(`Subscription ${subscription.id} deleted - Reset user ${data.user_id} (${customer.email}) to tier: none`);
            }
          }
        }
        break;
      }

      default:
        serverLog.debug(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    serverLog.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
