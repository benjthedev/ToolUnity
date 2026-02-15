import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyCsrfToken } from '@/lib/csrf';
import { serverLog } from '@/lib/logger';
import crypto from 'crypto';

// Generate a verification HMAC for a given email using the server secret
function generateVerificationToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || '';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Helper: wait for ms milliseconds
 */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    console.log('[SEND-VERIFICATION-EMAIL] Request received');
    
    const csrfCheck = await verifyCsrfToken(request);
    console.log('[SEND-VERIFICATION-EMAIL] CSRF check result:', csrfCheck.valid);
    
    if (!csrfCheck.valid) {
      console.error('[SEND-VERIFICATION-EMAIL] CSRF validation failed');
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }

    const body = await request.json();
    userId = body.userId;
    const { email } = body;
    const normalizedEmail = email?.toLowerCase().trim();
    console.log('[SEND-VERIFICATION-EMAIL] Attempting for userId:', userId, 'email:', normalizedEmail);

    if (!normalizedEmail || !userId) {
      console.error('[SEND-VERIFICATION-EMAIL] Missing email or userId');
      return NextResponse.json({ error: 'Email and userId required' }, { status: 400 });
    }

    // Look up user by user_id ONLY (not email) to avoid case-sensitivity mismatches
    // The email from the trigger may differ in casing from what the client sent
    const adminSb = getSupabaseAdmin();
    
    let userRecord: any = null;
    let lookupError: any = null;
    const maxLookupAttempts = 3;

    for (let attempt = 1; attempt <= maxLookupAttempts; attempt++) {
      console.log(`[SEND-VERIFICATION-EMAIL] Lookup attempt ${attempt}/${maxLookupAttempts} for user_id:`, userId);
      
      const result = await adminSb
        .from('users_ext')
        .select('user_id, email, phone_number')
        .eq('user_id', userId)
        .single();

      lookupError = result.error;
      userRecord = result.data;

      if (userRecord) {
        console.log('[SEND-VERIFICATION-EMAIL] User found on attempt', attempt, '- email:', userRecord.email, 'phone:', userRecord.phone_number ? 'YES' : 'NO');
        break;
      }

      // User not found - might be trigger race condition, wait and retry
      console.warn(`[SEND-VERIFICATION-EMAIL] User not found on attempt ${attempt}, error:`, lookupError?.message || 'no data');
      if (attempt < maxLookupAttempts) {
        await delay(800 * attempt); // 800ms, 1600ms backoff
      }
    }
    
    if (!userRecord) {
      console.error('[SEND-VERIFICATION-EMAIL] User not found after', maxLookupAttempts, 'attempts - user_id:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send verification email via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('[SEND-VERIFICATION-EMAIL] RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    console.log('[SEND-VERIFICATION-EMAIL] RESEND_API_KEY is configured');

    // Generate an HMAC-signed verification token (no DB storage needed)
    // Always use normalized (lowercase) email for token generation and sending
    const verificationToken = generateVerificationToken(normalizedEmail);
    const verificationLink = `${process.env.NEXTAUTH_URL}/api/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${verificationToken}`;
    
    console.log('[SEND-VERIFICATION-EMAIL] Sending email via Resend to:', normalizedEmail);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@toolunity.app',
        to: normalizedEmail,
        subject: 'Verify your ToolUnity email address',
        html: `
          <h2>Welcome to ToolUnity!</h2>
          <p>Thank you for signing up. Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
              Verify Email Address
            </a>
          </p>
          <p>This link expires in 24 hours.</p>
        `,
      }),
    });

    const responseData = await response.json();
    console.log('[SEND-VERIFICATION-EMAIL] Resend API response status:', response.status);
    console.log('[SEND-VERIFICATION-EMAIL] Resend API response body:', JSON.stringify(responseData));

    if (!response.ok) {
      console.error('[SEND-VERIFICATION-EMAIL] Resend API error:', JSON.stringify(responseData));
      console.error('[SEND-VERIFICATION-EMAIL] Status:', response.status, 'Email:', normalizedEmail);
      console.error('[SEND-VERIFICATION-EMAIL] Response headers:', JSON.stringify(Object.fromEntries(response.headers)));
      
      // ROLLBACK: Delete the user since email failed to send
      console.log('[SEND-VERIFICATION-EMAIL] Initiating rollback: deleting user', userId);
      try {
        const sbAdmin = getSupabaseAdmin();
        await sbAdmin.auth.admin.deleteUser(userId);
        console.log('[SEND-VERIFICATION-EMAIL] Rollback successful: user deleted');
      } catch (deleteErr) {
        console.error('[SEND-VERIFICATION-EMAIL] Rollback failed: could not delete user:', deleteErr);
      }
      
      // Check if it's an authentication issue
      if (response.status === 401) {
        throw new Error('Resend API authentication failed - invalid API key');
      }
      
      throw new Error(`Resend error: ${responseData?.message || JSON.stringify(responseData)}`);
    }

    console.log('[SEND-VERIFICATION-EMAIL] Email sent successfully to:', normalizedEmail);
    return NextResponse.json({ message: 'Verification email sent successfully' }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SEND-VERIFICATION-EMAIL] Caught error:', errorMsg);
    console.error('[SEND-VERIFICATION-EMAIL] Error stack:', error);
    serverLog.error('Send verification email error:', error);
    
    // ROLLBACK: Delete the user on any error during email sending
    if (userId) {
      console.log('[SEND-VERIFICATION-EMAIL] Initiating rollback due to exception: deleting user', userId);
      try {
        const sbAdmin = getSupabaseAdmin();
        await sbAdmin.auth.admin.deleteUser(userId);
        console.log('[SEND-VERIFICATION-EMAIL] Rollback successful: user deleted due to exception');
      } catch (rollbackErr) {
        console.error('[SEND-VERIFICATION-EMAIL] Rollback failed:', rollbackErr);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to send verification email: ' + errorMsg },
      { status: 500 }
    );
  }
}
