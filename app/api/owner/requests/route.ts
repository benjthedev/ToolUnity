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

    // Fetch borrow requests for user's tools
    const { data: requests, error } = await supabase
      .from('borrow_requests')
      .select(
        `
        id,
        user_id,
        tool_id,
        start_date,
        end_date,
        notes,
        status,
        created_at,
        tools (
          id,
          name,
          owner_id
        ),
        users:user_id (
          email
        )
      `
      )
      .eq('tools.owner_id', session.user.id)
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

    if (!requestId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request or status' }, { status: 400 });
    }

    // Verify user owns the tool for this borrow request (CRITICAL: prevent unauthorized updates)
    const { data: borrowRequest, error: fetchError } = await supabase
      .from('borrow_requests')
      .select('tool_id, tools(owner_id)')
      .eq('id', requestId)
      .single();

    if (fetchError || !borrowRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const tool = Array.isArray(borrowRequest.tools) ? borrowRequest.tools[0] : borrowRequest.tools;
    if (!tool || tool.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this tool' }, { status: 403 });
    }

    // Update borrow request status
    const { data: updatedRequest, error } = await supabase
      .from('borrow_requests')
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
