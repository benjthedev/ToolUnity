export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { serverLog } from '@/lib/logger';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimitByUserId } from '@/lib/rate-limit';

let supabase: any = null;

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
  // Verify CSRF token
  const csrfCheck = await verifyCsrfToken(request);
  if (!csrfCheck.valid) {
    return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Rate limit (5 per hour per user)
  const rateLimitCheck = checkRateLimitByUserId(session.user.id, 5, 60 * 60 * 1000);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Reset the subscription tier to 'none' for the current user
  const { data, error } = await getSupabase()
    .from('users_ext')
    .update({ 
      subscription_tier: 'none'
    })
    .eq('email', session.user.email)
    .select();

  if (error) {
    serverLog.error('Error resetting tier:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Subscription tier reset to none',
    data 
  });
}
