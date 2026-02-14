import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// POST /api/tool-requests/upvote - Toggle upvote on a tool request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to upvote' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if user already upvoted
    const { data: existingUpvote } = await supabase
      .from('tool_request_upvotes')
      .select('id')
      .eq('request_id', requestId)
      .eq('user_id', session.user.id)
      .single();

    if (existingUpvote) {
      // Remove upvote
      await supabase
        .from('tool_request_upvotes')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', session.user.id);

      // Decrement count
      const { data: currentRequest } = await supabase
        .from('tool_requests')
        .select('upvote_count')
        .eq('id', requestId)
        .single();

      await supabase
        .from('tool_requests')
        .update({ upvote_count: Math.max(0, (currentRequest?.upvote_count || 1) - 1) })
        .eq('id', requestId);

      return NextResponse.json({ action: 'removed', message: 'Upvote removed' });
    } else {
      // Add upvote
      const { error: upvoteError } = await supabase
        .from('tool_request_upvotes')
        .insert({
          request_id: requestId,
          user_id: session.user.id,
        });

      if (upvoteError) {
        console.error('Error adding upvote:', upvoteError);
        return NextResponse.json({ error: 'Failed to add upvote' }, { status: 500 });
      }

      // Increment count
      const { data: currentRequest } = await supabase
        .from('tool_requests')
        .select('upvote_count')
        .eq('id', requestId)
        .single();

      await supabase
        .from('tool_requests')
        .update({ upvote_count: (currentRequest?.upvote_count || 0) + 1 })
        .eq('id', requestId);

      return NextResponse.json({ action: 'added', message: 'Upvote added' });
    }
  } catch (error) {
    console.error('Error in upvote POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
