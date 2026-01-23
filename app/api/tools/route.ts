import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

/**
 * DELETE /api/tools?id=<toolId>
 * Delete a tool and trigger tier check (issue #16: handle free tier downgrade)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('id');

    if (!toolId) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns the tool
    const { data: tool, error: fetchError } = await supabase
      .from('tools')
      .select('owner_id')
      .eq('id', toolId)
      .single();

    if (fetchError || !tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    if (tool.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this tool' },
        { status: 403 }
      );
    }

    // Delete the tool
    const { error: deleteError } = await supabase
      .from('tools')
      .delete()
      .eq('id', toolId);

    if (deleteError) {
      console.error('Tool deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tool' },
        { status: 500 }
      );
    }

    // Trigger tier check to handle free tier downgrade (issue #16)
    // If user drops from 3 tools to 2, they go from Standard free to Basic free
    // If user drops to 0 tools and has no paid subscription, they lose borrowing access
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscriptions/check-tool-count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      });
    } catch (err) {
      console.error('Error triggering tool count check:', err);
      // Don't fail the deletion if the check fails, but log it
    }

    return NextResponse.json(
      { message: 'Tool deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Tool deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
