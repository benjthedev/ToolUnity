export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import Stripe from 'stripe';
import { serverLog } from '@/lib/logger';

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
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Find all subscriptions for this email
    const subscriptions = await getStripe().subscriptions.list({
      limit: 100,
    });

    // Filter for this user's email
    let userSubscription = null;
    for (const sub of subscriptions.data) {
      const customer = await getStripe().customers.retrieve(sub.customer as string);
      if ('email' in customer && customer.email === session.user.email) {
        // Get the most recent active or trialing subscription
        if ((sub.status === 'active' || sub.status === 'trialing') && (!userSubscription || sub.created > userSubscription.created)) {
          userSubscription = sub;
        }
      }
    }

    let newTier = 'none';

    if (userSubscription && (userSubscription.status === 'active' || userSubscription.status === 'trialing')) {
      // Get the price ID from the subscription
      const priceId = userSubscription.items.data[0]?.price.id;
      
      if (priceId === process.env.STRIPE_PRICE_BASIC) {
        newTier = 'basic';
      } else if (priceId === process.env.STRIPE_PRICE_STANDARD) {
        newTier = 'standard';
      } else if (priceId === process.env.STRIPE_PRICE_PRO) {
        newTier = 'pro';
      } else {
        // Unknown price ID - log it for debugging
        serverLog.warn('Unknown price ID detected:', priceId);
        // Try to infer tier from product name if available
        const product = userSubscription.items.data[0]?.price.product;
        if (typeof product === 'object' && product !== null && 'name' in product) {
          const productName = product.name.toLowerCase();
          if (productName.includes('standard')) {
            newTier = 'standard';
          } else if (productName.includes('basic')) {
            newTier = 'basic';
          } else if (productName.includes('pro')) {
            newTier = 'pro';
          }
        }
      }

      // Store the customer ID if it exists in the database
      const customerId = userSubscription.customer;
      
      // Update database - only update subscription_tier
      const { error } = await getSupabase()
        .from('users_ext')
        .update({
          subscription_tier: newTier,
        })
        .eq('email', session.user.email);

      if (error) {
        serverLog.error('Error syncing subscription:', error);
        return NextResponse.json({ 
          error: error.message,
          tier: newTier,
          synced: false
        }, { status: 500 });
      }

      return NextResponse.json({ 
        synced: true,
        tier: newTier,
        message: `Updated to ${newTier} tier (${userSubscription.status})`
      });
    } else {
      // No active subscription - check if user qualifies for free tier via tool count
      const { data: userData, error: userError } = await getSupabase()
        .from('users_ext')
        .select('tools_count')
        .eq('user_id', session.user.id)
        .single();

      if (userError || !userData) {
        serverLog.error('Error fetching user tools count:', userError);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
      }

      let tierToSet = 'none';
      
      // Check tool count incentive
      if (userData.tools_count >= 3) {
        tierToSet = 'standard'; // 3+ tools = Standard tier free waiver
      } else if (userData.tools_count >= 1) {
        tierToSet = 'basic'; // 1+ tools = Basic tier free waiver
      }

      // Update database with the appropriate tier
      const { error } = await getSupabase()
        .from('users_ext')
        .update({ subscription_tier: tierToSet })
        .eq('user_id', session.user.id);

      if (error) {
        serverLog.error('Error updating tier:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        synced: true,
        tier: tierToSet,
        message: tierToSet === 'none' 
          ? 'No active subscription and no tools listed - set to free' 
          : `Upgraded to ${tierToSet} tier (free waiver via ${userData.tools_count} tool${userData.tools_count > 1 ? 's' : ''})`
      });
    }
  } catch (error) {
    serverLog.error('Error syncing subscription:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
