import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export async function GET() {
  try {
    console.log('Admin rentals API called');
    
    // Simple test query
    const { data, error } = await supabase
      .from('rentals')
      .select('id, status, created_at')
      .limit(10);

    console.log('Query result - error:', error, 'data length:', data?.length);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: error.message,
        rentals: []
      }, { status: 200 });
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
    }, { status: 200 });
  }
}
