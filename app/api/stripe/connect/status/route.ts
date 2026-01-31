import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Connect account ID
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', session.user.id)
      .single();

    if (!userData?.stripe_connect_account_id) {
      return NextResponse.json({ 
        connected: false,
        detailsSubmitted: false,
        chargesEnabled: false 
      });
    }

    // Check account status with Stripe
    const account = await stripe.accounts.retrieve(userData.stripe_connect_account_id);

    return NextResponse.json({
      connected: true,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error: any) {
    console.error('Connect status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check connection status' },
      { status: 500 }
    );
  }
}
