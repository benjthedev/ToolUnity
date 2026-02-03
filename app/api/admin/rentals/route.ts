import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    console.log('Admin rentals request - session:', session?.user?.email);
    
    // Temporarily skip auth for debugging
    // if (!session?.user?.email) {
    //   console.log('No session email found');
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // if (session.user.email !== ADMIN_EMAIL) {
    //   console.log(`Access denied for ${session.user.email}, admin email is ${ADMIN_EMAIL}`);
    //   return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    // }

    // Fetch all rentals
    const { data: rentals, error } = await supabase
      .from('rentals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch rentals', 
        details: JSON.stringify(error)
      }, { status: 500 });
    }

    console.log(`Returning ${rentals?.length || 0} rentals`);
    return NextResponse.json({ rentals: rentals || [] });
  } catch (error) {
    console.error('Admin rentals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
