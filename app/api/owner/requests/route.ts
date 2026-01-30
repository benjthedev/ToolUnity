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

    // Fetch rental requests for owner's tools
    const { data: requests, error } = await supabase
      .from('rental_transactions')
      .select(
        `
        id,
        renter_id,
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
          id,
          name,
          owner_id
        ),
        renter:renter_id (
          email
        )
      `
      )
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      serverLog.error('Error fetching owner requests:', error);
      return NextResponse.json({ error: 'Error fetching requests' }, { status: 500 });
    }

    return NextResponse.json(
      {
        requests: requests || [],
      },
      { status: 200 }
    );
  } catch (error) {
    serverLog.error('Fetch owner requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, status } = body;

    if (!requestId || !['approved', 'rejected', 'active', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request or status' }, { status: 400 });
    }

    // Verify user owns the tool for this rental request
    const { data: rentalRequest, error: fetchError } = await supabase
      .from('rental_transactions')
      .select('tool_id, owner_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !rentalRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (rentalRequest.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this tool' }, { status: 403 });
    }

    // Update rental request status
    const { data: updatedRequest, error } = await supabase
      .from('rental_transactions')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Error updating request' }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Request updated',
        request: updatedRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    serverLog.error('Update request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
