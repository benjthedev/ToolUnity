import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a Connect account
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', session.user.id)
      .single();

    let accountId = userData?.stripe_connect_account_id;

    // Create new Connect account if they don't have one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: session.user.email!,
        capabilities: {
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      // Save account ID to database
      await supabaseAdmin
        .from('users')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', session.user.id);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connect=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connect=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Connect onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding session' },
      { status: 500 }
    );
  }
}
