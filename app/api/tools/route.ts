import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { serverLog } from '@/lib/logger';

/**
 * DELETE /api/tools?id=<toolId>
 * Delete a tool and trigger tier check (issue #16: handle free tier downgrade)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE-TOOL] Starting tool deletion request');
    
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    console.log('[DELETE-TOOL] CSRF check result:', csrfCheck);
    
    if (!csrfCheck.valid) {
      console.log('[DELETE-TOOL] CSRF validation failed');
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    console.log('[DELETE-TOOL] Session user ID:', session?.user?.id);

    if (!session?.user?.id) {
      console.log('[DELETE-TOOL] No session or user ID');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('id');
    console.log('[DELETE-TOOL] Tool ID from params:', toolId);

    if (!toolId) {
      console.log('[DELETE-TOOL] No tool ID provided');
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
      .is('deleted_at', null)
      .single();

    console.log('[DELETE-TOOL] Tool fetch result:', { tool, fetchError });

    if (fetchError || !tool) {
      console.log('[DELETE-TOOL] Tool not found or fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    if (tool.owner_id !== session.user.id) {
      console.log('[DELETE-TOOL] Ownership check failed:', { toolOwner: tool.owner_id, sessionUser: session.user.id });
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this tool' },
        { status: 403 }
      );
    }

    // Soft delete the tool (mark as deleted instead of removing)
    const { error: deleteError } = await supabase
      .from('tools')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', toolId);

    console.log('[DELETE-TOOL] Delete result:', { deleteError });

    if (deleteError) {
      serverLog.error('Tool deletion error:', deleteError);
      console.log('[DELETE-TOOL] Delete failed:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tool', details: deleteError.message },
        { status: 500 }
      );
    }

    // Update tools_count in users_ext (count non-deleted tools)
    try {
      const { data: toolCount } = await supabase
        .from('tools')
        .select('id')
        .eq('owner_id', session.user.id)
        .is('deleted_at', null);
      
      const newCount = toolCount?.length || 0;
      
      await supabase
        .from('users_ext')
        .update({ tools_count: newCount })
        .eq('user_id', session.user.id);
    } catch (err) {
      serverLog.error('Error updating tools_count:', err);
      // Don't fail the deletion if the count update fails
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
      serverLog.error('Error triggering tool count check:', err);
      // Don't fail the deletion if the check fails, but log it
    }

    return NextResponse.json(
      { message: 'Tool deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    serverLog.error('Tool deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
