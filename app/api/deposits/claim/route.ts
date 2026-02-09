import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { checkRateLimitByUserId } from '@/lib/rate-limit';
import { DEPOSIT_STATUS } from '@/lib/deposit-config';

/**
 * POST /api/deposits/claim
 * Owner reports damage and claims the deposit
 * 
 * This endpoint:
 * 1. Verifies the caller is the tool owner
 * 2. Checks the rental is returned and within the claim window
 * 3. Updates deposit_status to 'claimed'
 * 4. Sends notifications to renter and admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitCheck = checkRateLimitByUserId(session.user.id, 10, 3600000);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { rental_id, reason } = body;

    if (!rental_id) {
      return NextResponse.json({ error: 'Missing rental_id' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a detailed description of the damage (at least 10 characters)' },
        { status: 400 }
      );
    }

    // Fetch rental and verify ownership
    const { data: rental, error: fetchError } = await supabase
      .from('rental_transactions')
      .select(`
        id,
        owner_id,
        renter_id,
        status,
        deposit_amount,
        deposit_status,
        claim_window_ends_at,
        return_confirmed_at,
        tool_id,
        tools:tool_id(name)
      `)
      .eq('id', rental_id)
      .single();

    if (fetchError || !rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Verify caller is the tool owner
    if (rental.owner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the tool owner can claim deposits' }, { status: 403 });
    }

    // Check deposit is in a claimable state (held or pending_release)
    if (rental.deposit_status !== DEPOSIT_STATUS.HELD && rental.deposit_status !== DEPOSIT_STATUS.PENDING_RELEASE) {
      return NextResponse.json(
        { error: `Cannot claim deposit - current status: ${rental.deposit_status}` },
        { status: 400 }
      );
    }

    // Update deposit status to claimed
    const { error: updateError } = await supabase
      .from('rental_transactions')
      .update({
        deposit_status: DEPOSIT_STATUS.CLAIMED,
        deposit_claimed_at: new Date().toISOString(),
        deposit_claim_reason: reason.trim(),
      })
      .eq('id', rental_id);

    if (updateError) {
      console.error('Error claiming deposit:', updateError);
      return NextResponse.json({ error: 'Failed to claim deposit' }, { status: 500 });
    }

    // Send notification emails
    try {
      const toolName = rental.tools?.name || 'the tool';

      // Notify renter about the claim
      const { data: renterData } = await supabase
        .from('users_ext')
        .select('email, username')
        .eq('user_id', rental.renter_id)
        .single();

      if (renterData?.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ToolUnity <noreply@toolunity.co.uk>',
            to: renterData.email,
            subject: `Damage reported for ${toolName} - Deposit under review`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Damage Report Filed</h2>
                <p>The owner of <strong>${toolName}</strong> has reported damage to the tool after your rental.</p>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                  <h3 style="margin-top: 0; color: #991b1b;">Owner's Report:</h3>
                  <p style="margin-bottom: 0;">${reason}</p>
                </div>
                
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                  <h3 style="margin-top: 0; color: #1e40af;">What Happens Next?</h3>
                  <p>Your £${rental.deposit_amount?.toFixed(2) || '10.00'} deposit is currently being held while we review this claim.</p>
                  <p>A ToolUnity admin will review the report and make a fair decision. You may be contacted for your side of the story.</p>
                  <p style="margin-bottom: 0;"><strong>If no damage is confirmed, your deposit will be refunded in full.</strong></p>
                </div>
                
                <p>If you have any questions, contact us at <a href="mailto:support@toolunity.co.uk">support@toolunity.co.uk</a></p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px;">ToolUnity - Share tools, build community</p>
              </div>
            `,
          }),
        });
      }

      // Notify admin about the claim
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ToolUnity <noreply@toolunity.co.uk>',
          to: 'benclarknfk@gmail.com',
          subject: `⚠️ Deposit Claim: ${toolName} - Action Required`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">New Deposit Claim - Review Required</h2>
              <p>A tool owner has reported damage and claimed a deposit.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Rental ID:</strong> ${rental_id}</p>
                <p><strong>Tool:</strong> ${toolName}</p>
                <p><strong>Deposit Amount:</strong> £${rental.deposit_amount?.toFixed(2) || '10.00'}</p>
                <p><strong>Renter:</strong> ${renterData?.email || 'Unknown'}</p>
              </div>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                <h3 style="margin-top: 0;">Damage Report:</h3>
                <p style="margin-bottom: 0;">${reason}</p>
              </div>
              
              <p><strong>Action needed:</strong> Review the claim and decide whether to forfeit or refund the deposit via the admin dashboard.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/deposits" 
                 style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
                Review Claim →
              </a>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      console.error('Error sending deposit claim emails:', emailError);
      // Don't fail if emails fail
    }

    return NextResponse.json({
      success: true,
      message: 'Damage claim submitted. The deposit is being held while we review your report. An admin will be in touch.',
    });
  } catch (error) {
    console.error('Deposit claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
