import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client for unrestricted access
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('rental_transactions')
      .select(`
        *,
        tools:tool_id(id, name),
        renter:renter_id(id, email, username),
        owner:owner_id(id, email, username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch rentals',
        rentals: []
      });
    }

    return NextResponse.json({ 
      rentals: data || [],
      count: data?.length || 0
    });
  } catch (err) {
    return NextResponse.json({ 
      error: 'Internal server error',
      rentals: []
    });
  }
}
