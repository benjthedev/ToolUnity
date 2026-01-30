import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { serverLog } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's rental transactions
    const { data: requests, error } = await supabase
      .from('rental_transactions')
      .select(
        `
        id,
        tool_id,
        start_date,
        end_date,
        duration_days,
        daily_rate,
        rental_cost,
        total_cost,
        notes,
        status,
        created_at,
        tools:tool_id (
          name,
          category,
          tool_value,
          daily_rate
        )
      `
      )
      .eq('renter_id', session.user.id)
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
    serverLog.error('Fetch requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
