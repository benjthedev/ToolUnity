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

    // Fetch all rentals with related data
    const { data: rentals, error } = await supabase
      .from('rentals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals:', error);
      return NextResponse.json({ error: 'Failed to fetch rentals' }, { status: 500 });
    }

    // Fetch related data for each rental
    const enrichedRentals = await Promise.all(
      (rentals || []).map(async (rental) => {
        const [toolRes, borrowerRes, ownerRes] = await Promise.all([
          supabase.from('tools').select('name, daily_rate').eq('id', rental.tool_id).single(),
          supabase.from('users').select('name, email').eq('id', rental.borrower_id).single(),
          supabase.from('users').select('name, email').eq('id', rental.owner_id).single(),
        ]);

        return {
          ...rental,
          tools: toolRes.data || {},
          borrower: borrowerRes.data || {},
          owner: ownerRes.data || {},
        };
      })
    );

    return NextResponse.json({ rentals: enrichedRentals || [] });
  } catch (error) {
    console.error('Admin rentals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
