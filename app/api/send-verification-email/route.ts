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

export async function POST(request: NextRequest) {
  try {
    console.log('[SEND-VERIFICATION-EMAIL] Request received');
    
    const csrfCheck = await verifyCsrfToken(request);
    console.log('[SEND-VERIFICATION-EMAIL] CSRF check result:', csrfCheck.valid);
    
    if (!csrfCheck.valid) {
      console.error('[SEND-VERIFICATION-EMAIL] CSRF validation failed');
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email } = body;
    console.log('[SEND-VERIFICATION-EMAIL] Attempting to send email to:', email, 'for userId:', userId);
    console.log('[SEND-VERIFICATION-EMAIL] Request headers:', {
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
    });

    if (!email || !userId) {
      console.error('[SEND-VERIFICATION-EMAIL] Missing email or userId');
      return NextResponse.json({ error: 'Email and userId required' }, { status: 400 });
    }

    // Verify that the userId actually owns this email in users_ext
    console.log('[SEND-VERIFICATION-EMAIL] Looking up user in users_ext...');
    const sb = getSupabaseAdmin();
    const { data: userRecord, error: lookupError } = await sb
      .from('users_ext')
      .select('user_id, email')
      .eq('user_id', userId)
      .eq('email', email)
      .single();

    if (lookupError) {
      console.error('[SEND-VERIFICATION-EMAIL] User lookup error:', lookupError);
      console.error('[SEND-VERIFICATION-EMAIL] Error code:', lookupError.code);
      console.error('[SEND-VERIFICATION-EMAIL] Error message:', lookupError.message);
      console.error('[SEND-VERIFICATION-EMAIL] Error details:', JSON.stringify(lookupError));
    }
    
    if (!userRecord) {
      console.error('[SEND-VERIFICATION-EMAIL] User not found in users_ext');
      console.error('[SEND-VERIFICATION-EMAIL] Looked for user_id:', userId, 'email:', email);
      console.error('[SEND-VERIFICATION-EMAIL] This is likely an RLS policy blocking the query');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('[SEND-VERIFICATION-EMAIL] User found in users_ext');

    // Send verification email via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('[SEND-VERIFICATION-EMAIL] RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    console.log('[SEND-VERIFICATION-EMAIL] RESEND_API_KEY is configured');

    // Generate an HMAC-signed verification token (no DB storage needed)
    const verificationToken = generateVerificationToken(email);
    const verificationLink = `${process.env.NEXTAUTH_URL}/api/verify-email?email=${encodeURIComponent(email)}&token=${verificationToken}`;
    
    console.log('[SEND-VERIFICATION-EMAIL] Sending email via Resend...');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@toolunity.app',
        to: email,
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
      console.error('[SEND-VERIFICATION-EMAIL] Status:', response.status, 'Email:', email);
      console.error('[SEND-VERIFICATION-EMAIL] Response headers:', JSON.stringify(Object.fromEntries(response.headers)));
      
      // Check if it's an authentication issue
      if (response.status === 401) {
        throw new Error('Resend API authentication failed - invalid API key');
      }
      
      throw new Error(`Resend error: ${responseData?.message || JSON.stringify(responseData)}`);
    }

    console.log('[SEND-VERIFICATION-EMAIL] Email sent successfully to:', email);
    return NextResponse.json({ message: 'Verification email sent successfully' }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SEND-VERIFICATION-EMAIL] Caught error:', errorMsg);
    console.error('[SEND-VERIFICATION-EMAIL] Error stack:', error);
    serverLog.error('Send verification email error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send verification email: ' + errorMsg },
      { status: 500 }
    );
  }
}
