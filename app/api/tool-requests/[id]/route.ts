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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verify the request belongs to the user
    const { data: existingRequest } = await supabase
      .from('tool_requests')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingRequest || existingRequest.user_id !== session.user.id) {
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ request: updatedRequest[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating tool request:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify the request belongs to the user
    const { data: existingRequest } = await supabase
      .from('tool_requests')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingRequest || existingRequest.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the request (upvotes will cascade delete due to foreign key)
    const { error } = await supabase
      .from('tool_requests')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Request deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting tool request:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
