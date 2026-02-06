import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { serverLog } from '@/lib/logger';
import crypto from 'crypto';

// Generate a verification HMAC for a given email using the server secret
function generateVerificationToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || '';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email || !token) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
    }

    serverLog.info('Verifying email:', { email });

    // Verify the token is a valid HMAC of the email
    const expectedToken = generateVerificationToken(email);

    let tokensMatch = false;
    try {
      tokensMatch = crypto.timingSafeEqual(
        Buffer.from(token, 'utf-8'),
        Buffer.from(expectedToken, 'utf-8')
      );
    } catch {
      tokensMatch = false;
    }

    if (!tokensMatch) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
    }

    // Token is valid — mark email as verified
    const { error } = await supabase
      .from('users_ext')
      .update({ email_verified: true })
      .eq('email', email);

    if (error) {
      serverLog.error('Email verification error:', error);
      return NextResponse.redirect(new URL('/verify-email?error=failed', request.url));
    }

    return NextResponse.redirect(new URL('/verify-email?success=true', request.url));
  } catch (error) {
    serverLog.error('Verification error:', error);
    return NextResponse.redirect(new URL('/verify-email?error=server', request.url));
  }
}
