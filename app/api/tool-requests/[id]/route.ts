import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[TOOL-REQUESTS-ID-PATCH] Request received for ID:', params.id);
    console.log('[TOOL-REQUESTS-ID-PATCH] ID type:', typeof params.id, 'ID length:', params.id?.length);
    const session = await getServerSession(authOptions);
    console.log('[TOOL-REQUESTS-ID-PATCH] Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.error('[TOOL-REQUESTS-ID-PATCH] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    console.log('[TOOL-REQUESTS-ID-PATCH] Update body:', body);
    console.log('[TOOL-REQUESTS-ID-PATCH] Looking up request with ID:', { id, idType: typeof id, idLength: id?.length });

    // Debug: Check if any requests exist for this user
    const { data: allUserRequests, error: debugError } = await supabase
      .from('tool_requests')
      .select('id, user_id')
      .eq('user_id', session.user.id);
    
    console.log('[TOOL-REQUESTS-ID-PATCH] All requests for user:', { count: allUserRequests?.length, error: debugError?.message, requests: allUserRequests });

    // Verify the request belongs to the user
    const { data: existingRequest, error: lookupError } = await supabase
      .from('tool_requests')
      .select('*')
      .eq('id', id)
      .single();

    console.log('[TOOL-REQUESTS-ID-PATCH] Query result:', { lookupError: lookupError?.message, requestData: existingRequest });
    console.log('[TOOL-REQUESTS-ID-PATCH] Comparison:', { 
      existingUserID: existingRequest?.user_id,
      sessionUserID: session.user.id,
      match: existingRequest?.user_id === session.user.id,
      existingUserIDType: typeof existingRequest?.user_id,
      sessionUserIDType: typeof session.user.id
    });

    if (!existingRequest || existingRequest.user_id !== session.user.id) {
      console.error('[TOOL-REQUESTS-ID-PATCH] Forbidden - user_id mismatch or not found');
      console.error('[TOOL-REQUESTS-ID-PATCH] Details:', {
        requestExists: !!existingRequest,
        userIDMatch: existingRequest?.user_id === session.user.id,
        existingUserID: existingRequest?.user_id,
        sessionUserID: session.user.id
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the request
    const { data: updatedRequest, error } = await supabase
      .from('tool_requests')
      .update({
        tool_name: body.tool_name,
        category: body.category,
        postcode: body.postcode,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    console.log('[TOOL-REQUESTS-ID-PATCH] Update result:', { success: !!updatedRequest, error });

    if (error) {
      console.error('[TOOL-REQUESTS-ID-PATCH] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('[TOOL-REQUESTS-ID-PATCH] Update successful');
    return NextResponse.json({ request: updatedRequest[0] }, { status: 200 });
  } catch (error) {
    console.error('[TOOL-REQUESTS-ID-PATCH] Caught error:', error);
    return NextResponse.json({ error: 'Internal error: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[TOOL-REQUESTS-ID-DELETE] Request received for ID:', params.id);
    const session = await getServerSession(authOptions);
    console.log('[TOOL-REQUESTS-ID-DELETE] Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.error('[TOOL-REQUESTS-ID-DELETE] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    console.log('[TOOL-REQUESTS-ID-DELETE] Looking up request with ID:', { id, idType: typeof id, idLength: id?.length });

    // Debug: Check if any requests exist for this user
    const { data: allUserRequests, error: debugError } = await supabase
      .from('tool_requests')
      .select('id, user_id')
      .eq('user_id', session.user.id);
    
    console.log('[TOOL-REQUESTS-ID-DELETE] All requests for user:', { count: allUserRequests?.length, error: debugError?.message, requests: allUserRequests });

    // Verify the request belongs to the user
    const { data: existingRequest, error: lookupError } = await supabase
      .from('tool_requests')
      .select('*')
      .eq('id', id)
      .single();

    console.log('[TOOL-REQUESTS-ID-DELETE] Query result:', { lookupError: lookupError?.message, requestData: existingRequest });
    console.log('[TOOL-REQUESTS-ID-DELETE] Comparison:', { 
      existingUserID: existingRequest?.user_id,
      sessionUserID: session.user.id,
      match: existingRequest?.user_id === session.user.id,
      existingUserIDType: typeof existingRequest?.user_id,
      sessionUserIDType: typeof session.user.id
    });

    if (!existingRequest || existingRequest.user_id !== session.user.id) {
      console.error('[TOOL-REQUESTS-ID-DELETE] Forbidden - user_id mismatch or not found');
      console.error('[TOOL-REQUESTS-ID-DELETE] Details:', {
        requestExists: !!existingRequest,
        userIDMatch: existingRequest?.user_id === session.user.id,
        existingUserID: existingRequest?.user_id,
        sessionUserID: session.user.id
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the request (upvotes will cascade delete due to foreign key)
    const { error } = await supabase
      .from('tool_requests')
      .delete()
      .eq('id', id);

    console.log('[TOOL-REQUESTS-ID-DELETE] Delete result:', { error });

    if (error) {
      console.error('[TOOL-REQUESTS-ID-DELETE] Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('[TOOL-REQUESTS-ID-DELETE] Delete successful');
    return NextResponse.json({ message: 'Request deleted' }, { status: 200 });
  } catch (error) {
    console.error('[TOOL-REQUESTS-ID-DELETE] Caught error:', error);
    return NextResponse.json({ error: 'Internal error: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
  }
}
