import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Reset the subscription tier to 'none' for the current user
  const { data, error } = await supabase
    .from('users_ext')
    .update({ 
      subscription_tier: 'none'
    })
    .eq('email', session.user.email)
    .select();

  if (error) {
    console.error('Error resetting tier:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Subscription tier reset to none',
    data 
  });
}
