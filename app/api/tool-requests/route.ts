import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

// GET /api/tool-requests - Fetch all open tool requests
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const includeAll = searchParams.get('all') === 'true'; // For admin

    let query = supabase
      .from('tool_requests')
      .select('*')
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (!includeAll) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Error fetching tool requests:', error);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    // If user is logged in, check which requests they've upvoted
    let userUpvotes: string[] = [];
    if (session?.user?.id) {
      const { data: upvotes } = await supabase
        .from('tool_request_upvotes')
        .select('request_id')
        .eq('user_id', session.user.id);

      if (upvotes) {
        userUpvotes = upvotes.map((u: { request_id: string }) => u.request_id);
      }
    }

    return NextResponse.json({
      requests: requests || [],
      userUpvotes,
    });
  } catch (error) {
    console.error('Error in tool-requests GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tool-requests - Create a new tool request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to request a tool' }, { status: 401 });
    }

    const body = await request.json();
    const { toolName, category, postcode, description } = body;

    if (!toolName || !category || !postcode) {
      return NextResponse.json(
        { error: 'Tool name, category, and postcode are required' },
        { status: 400 }
      );
    }

    // Validate postcode format (basic UK postcode check)
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid UK postcode (e.g. NR12 9RR)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('tool_requests')
      .insert({
        user_id: session.user.id,
        tool_name: toolName.trim(),
        category: category.trim(),
        postcode: postcode.trim().toUpperCase(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tool request:', error);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    return NextResponse.json({ request: data }, { status: 201 });
  } catch (error) {
    console.error('Error in tool-requests POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
