import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all rentals
    const { data: rentals, error } = await supabase
      .from('rentals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals:', error);
      return NextResponse.json({ error: 'Failed to fetch rentals', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ rentals: rentals || [] });
  } catch (error) {
    console.error('Admin rentals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
