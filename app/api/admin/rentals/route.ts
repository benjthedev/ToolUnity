import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
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

    // Fetch all rentals with related data
    const { data: rentals, error } = await supabase
      .from('rentals')
      .select(`
        *,
        tools:tool_id (
          name,
          daily_rate
        ),
        borrower:borrower_id (
          name,
          email
        ),
        owner:owner_id (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals:', error);
      return NextResponse.json({ error: 'Failed to fetch rentals' }, { status: 500 });
    }

    return NextResponse.json({ rentals: rentals || [] });
  } catch (error) {
    console.error('Admin rentals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
