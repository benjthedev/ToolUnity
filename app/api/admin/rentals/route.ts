import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export async function GET() {
  try {
    console.log('Admin rentals API called');
    
    // Use admin client for unrestricted access
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Query result - error:', error, 'data length:', data?.length);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: error.message,
        rentals: []
      });
    }

    return NextResponse.json({ 
      rentals: data || [],
      count: data?.length || 0
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      rentals: []
    });
  }
}
