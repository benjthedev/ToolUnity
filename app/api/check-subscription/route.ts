export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get current subscription tier from database
    const { data: userData, error: userError } = await supabase
      .from('users_ext')
      .select('subscription_tier, stripe_customer_id, email')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If they don't have a paid tier, no need to check
    if (!userData.subscription_tier || ['none', 'free'].includes(userData.subscription_tier)) {
      return NextResponse.json({ 
        stillActive: true, 
        tier: userData.subscription_tier,
        message: 'No active paid subscription to verify' 
      });
    }

    let hasActiveSubscription = false;

    // Try using stored customer ID first
    if (userData.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripe_customer_id,
          limit: 1,
          status: 'active',
        });
        hasActiveSubscription = subscriptions.data.length > 0;
        console.log(`Subscription check for customer ${userData.stripe_customer_id}: ${hasActiveSubscription}`);
      } catch (err) {
        console.error('Error checking subscription by customer ID:', err);
        // Fall back to email lookup
        const emailSubscriptions = await stripe.subscriptions.list({
          limit: 10,
        });
        hasActiveSubscription = emailSubscriptions.data.some(sub => {
          const customer = sub.customer;
          if (typeof customer === 'object' && 'email' in customer && customer.email) {
            return customer.email === session.user?.email && sub.status === 'active';
          }
          return false;
        });
      }
    } else {
      // No customer ID stored, try email lookup
      const subscriptions = await stripe.subscriptions.list({
        limit: 10,
      });
      hasActiveSubscription = subscriptions.data.some(sub => {
        const customer = sub.customer;
        if (typeof customer === 'object' && 'email' in customer && customer.email) {
          return customer.email === session.user?.email;
        }
        return false;
      });
    }

    if (!hasActiveSubscription) {
      // Subscription was cancelled - reset to 'none'
      console.log(`Downgrading ${session.user.email} - no active subscription found`);
      const { error: updateError } = await supabase
        .from('users_ext')
        .update({ subscription_tier: 'none' })
        .eq('email', session.user.email);

      if (updateError) {
        console.error('Error downgrading tier:', updateError);
        return NextResponse.json({ 
          stillActive: false, 
          downgraded: false,
          error: updateError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        stillActive: false, 
        downgraded: true,
        message: 'Subscription cancelled - tier reset to none'
      });
    }

    return NextResponse.json({ 
      stillActive: true, 
      tier: userData.subscription_tier,
      message: 'Subscription still active'
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
