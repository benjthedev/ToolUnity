export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { serverLog } from '@/lib/logger';
import { getStripePrices } from '@/lib/pricing-config';

let stripe: Stripe | null = null;
let supabase: any = null;

function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-15.clover',
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
  try {
    const body = await request.json();
    const { priceId, userId, email } = body;

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing priceId or userId' },
        { status: 400 }
      );
    }

    const prices = getStripePrices();
    
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: 
        // Only Standard and Pro get free trial (not Basic)
        (priceId === prices.STANDARD || priceId === prices.PRO)
          ? { trial_period_days: 14 }
          : {},
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.toolunity.co.uk'}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.toolunity.co.uk'}/dashboard?upgrade=cancelled`,
      client_reference_id: userId,
    };

    // Pre-fill email if provided
    if (email) {
      sessionConfig.customer_email = email;
    }

    const session = await getStripe().checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });
  } catch (error) {
    serverLog.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
