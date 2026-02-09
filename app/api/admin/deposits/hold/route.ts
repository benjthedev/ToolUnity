import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = 'benclarknfk@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Check auth (verify session)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the session to verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { rentalId, adminNotes } = body;

    if (!rentalId) {
      return NextResponse.json({ error: 'Missing rentalId' }, { status: 400 });
    }

    // Update the deposit status to 'held'
    const { error: updateError } = await supabase
      .from('rental_transactions')
      .update({
        deposit_status: 'held',
        deposit_admin_notes: adminNotes || 'Manually held by admin',
      })
      .eq('id', rentalId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error holding deposit:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to hold deposit' },
      { status: 500 }
    );
  }
}
