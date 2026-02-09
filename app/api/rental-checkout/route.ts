export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { serverLog } from '@/lib/logger';
import { verifyCsrfToken } from '@/lib/csrf';
import { DEPOSIT_AMOUNT } from '@/lib/deposit-config';

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

/**
 * Create a Stripe Checkout session for a rental payment
 * 
 * This endpoint:
 * 1. Validates the rental transaction exists and is pending payment
 * 2. Creates a Stripe Checkout session for the rental amount
 * 3. Returns the checkout URL for the frontend to redirect to
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }

    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check email verification
    if (!session.user.emailVerified) {
      return NextResponse.json(
        { error: 'Email verification required to rent tools' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rentalTransactionId } = body;

    if (!rentalTransactionId) {
      return NextResponse.json({ error: 'Missing rentalTransactionId' }, { status: 400 });
    }

    // Get the rental transaction
    const sb = getSupabase();
    const { data: rental, error: rentalError } = await sb
      .from('rental_transactions')
      .select(`
        id,
        renter_id,
        owner_id,
        tool_id,
        start_date,
        end_date,
        duration_days,
        daily_rate,
        rental_cost,
        total_cost,
        deposit_amount,
        status,
        tools:tool_id(name, image_url)
      `)
      .eq('id', rentalTransactionId)
      .single();

    if (rentalError || !rental) {
      serverLog.error('Rental transaction not found:', rentalError);
      return NextResponse.json({ error: 'Rental transaction not found' }, { status: 404 });
    }

    // Verify user is the renter
    if (rental.renter_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized - not the renter' }, { status: 403 });
    }

    // Verify status is pending_payment
    if (rental.status !== 'pending_payment') {
      return NextResponse.json(
        { error: `Cannot checkout - rental status is ${rental.status}` },
        { status: 400 }
      );
    }

    // Get user email for Stripe
    const { data: userProfile } = await sb
      .from('users_ext')
      .select('email')
      .eq('user_id', session.user.id)
      .single();

    // Create Stripe Checkout session for one-time payment
    const depositAmount = rental.deposit_amount || DEPOSIT_AMOUNT;
    const rentalAmountPence = Math.round(rental.rental_cost * 100);
    const depositAmountPence = Math.round(depositAmount * 100);

    const checkoutSession = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // One-time payment, NOT subscription
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: rentalAmountPence,
            product_data: {
              name: `Tool Rental: ${rental.tools?.name || 'Tool'}`,
              description: `${rental.duration_days} day${rental.duration_days > 1 ? 's' : ''} rental (${rental.start_date} to ${rental.end_date})`,
              images: rental.tools?.image_url ? [rental.tools.image_url] : [],
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'gbp',
            unit_amount: depositAmountPence,
            product_data: {
              name: 'Refundable Tool Deposit',
              description: `\u00a3${depositAmount.toFixed(2)} security deposit - automatically refunded within 7 days of return if no damage is reported`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        rental_transaction_id: rentalTransactionId,
        renter_id: session.user.id,
        owner_id: rental.owner_id,
        tool_id: rental.tool_id,
        type: 'rental_payment',
        deposit_amount: depositAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?rental=success&rental_id=${rentalTransactionId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tools/${rental.tool_id}?rental=cancelled`,
      customer_email: userProfile?.email || undefined,
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    serverLog.error('Rental checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
