import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/admin/deposits
 * Get all deposits with their statuses for admin management
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('rental_transactions')
      .select(`
        id,
        tool_id,
        renter_id,
        owner_id,
        status,
        deposit_amount,
        deposit_status,
        deposit_claim_reason,
        deposit_admin_notes,
        deposit_claimed_at,
        deposit_released_at,
        return_confirmed_at,
        claim_window_ends_at,
        stripe_payment_intent_id,
        deposit_refund_id,
        rental_cost,
        total_cost,
        start_date,
        end_date,
        created_at,
        tools:tool_id(id, name),
        renter:renter_id(id, email, username),
        owner:owner_id(id, email, username)
      `)
      .not('deposit_status', 'eq', 'none')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch deposits', deposits: [] });
    }

    return NextResponse.json({
      deposits: data || [],
      count: data?.length || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', deposits: [] });
  }
}
