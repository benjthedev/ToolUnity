export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import Stripe from 'stripe';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripe;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Find all subscriptions for this email
    const subscriptions = await getStripe().subscriptions.list({
      limit: 100,
    });

    const userSubs = [];
    
    for (const sub of subscriptions.data) {
      const customer = await getStripe().customers.retrieve(sub.customer as string);
      if ('email' in customer && customer.email === session.user.email) {
        const priceId = sub.items.data[0]?.price.id;
        const product = sub.items.data[0]?.price.product;
        const productName = typeof product === 'object' && product !== null && 'name' in product 
          ? product.name 
          : 'Unknown';
        
        userSubs.push({
          id: sub.id,
          status: sub.status,
          priceId,
          productName,
          created: new Date(sub.created * 1000).toISOString(),
          trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        });
      }
    }

    return NextResponse.json({
      email: session.user.email,
      subscriptions: userSubs,
      message: userSubs.length > 0 
        ? `Found ${userSubs.length} subscription(s)` 
        : 'No subscriptions found'
    });
  } catch (error) {
    console.error('Error checking Stripe subscription:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
