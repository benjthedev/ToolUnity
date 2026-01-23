import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's borrow requests
    const { data: requests, error } = await supabase
      .from('borrow_requests')
      .select(
        `
        id,
        tool_id,
        start_date,
        end_date,
        notes,
        status,
        created_at,
        tools (
          name,
          category,
          tool_value
        )
      `
      )
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error fetching requests' }, { status: 500 });
    }

    return NextResponse.json(
      {
        requests: requests || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
