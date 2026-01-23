import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      console.log('Development mode: Skipping signature verification (no secret configured)');
    } catch (error) {
      console.error('Failed to parse webhook body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  } else {
    // Production OR development with secret: require signature verification
    if (!sig) {
      console.error('Webhook missing signature - rejecting unsigned event');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!hasSecret) {
      console.error('CRITICAL: Webhook signature required but STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook signature verification failed - server misconfiguration' },
        { status: 500 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
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
        
        // Get the subscription details
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Update user tier based on price ID
          const priceId = subscription.items.data[0].price.id;
          let tier = 'none';
          
          if (priceId === 'price_1SmI9kBt1LczyCVDZeEMqvMJ') {
            tier = 'basic';
          } else if (priceId === 'price_1Sk7XZBt1LczyCVDOPofihFZ') {
            tier = 'standard';
          } else if (priceId === 'price_1Sk7YbBt1LczyCVDef9jBhUV') {
            tier = 'pro';
          }
          
          // Update the user's subscription tier and mark trial as used
          const { error } = await supabase
            .from('users_ext')
            .update({
              subscription_tier: tier,
              trial_used: true,
            })
            .eq('user_id', session.client_reference_id);
          
          if (error) {
            console.error('Error updating user tier:', error);
          } else {
            console.log(`Updated user ${session.client_reference_id} to tier: ${tier}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        // Subscription updates are handled via checkout.session.completed
        // This event fires too early before we can link the subscription
        console.log('Subscription updated - handled via checkout.session.completed');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Get the customer to find their email
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (customer && 'email' in customer && customer.email) {
          // Find the user by email and reset their tier to 'none'
          const { data, error: selectError } = await supabase
            .from('users_ext')
            .select('user_id')
            .eq('email', customer.email)
            .single();
          
          if (selectError) {
            console.error('Error finding user by email:', selectError);
            break;
          }
          
          if (data) {
            const { error: updateError } = await supabase
              .from('users_ext')
              .update({
                subscription_tier: 'none',
              })
              .eq('user_id', data.user_id);
            
            if (updateError) {
              console.error('Error resetting user tier:', updateError);
            } else {
              console.log(`Subscription ${subscription.id} deleted - Reset user ${data.user_id} (${customer.email}) to tier: none`);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
