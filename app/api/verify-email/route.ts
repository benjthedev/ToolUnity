import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { serverLog } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
    }

    // Simple: just mark this email as verified
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
