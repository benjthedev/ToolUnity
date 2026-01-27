import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { serverLog } from '@/lib/logger';

// Type definitions for type safety
interface VerificationToken {
  user_id: string;
  email_verified: boolean;
  email_verification_sent_at: string | null;
  email_verification_token: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(
        new URL('/verify-email?error=invalid', request.url)
      );
    }

    // Find user with this verification token
    // Handle case where email_verified/email_verification_token columns don't exist yet
    let users: VerificationToken | null;
    let selectError: any;
    
    try {
      const result = await supabase
        .from('users_ext')
        .select('user_id, email_verified, email_verification_sent_at, email_verification_token')
        .eq('email_verification_token', token)
        .eq('email', email)
        .single();
      users = result.data as VerificationToken | null;
      selectError = result.error;
    } catch (err) {
      // If columns don't exist, just verify by email
      const result = await supabase
        .from('users_ext')
        .select('user_id')
        .eq('email', email)
        .single();
      users = result.data ? { 
        user_id: result.data.user_id, 
        email_verified: false,
        email_verification_sent_at: null,
        email_verification_token: null
      } as VerificationToken : null;
      selectError = result.error;
    }

    if (selectError || !users) {
      return NextResponse.redirect(
        new URL('/verify-email?error=invalid', request.url)
      );
    }

    // Check if token has expired (15 minutes) - REQUIRE sent_at validation
    if (!users.email_verification_sent_at) {
      return NextResponse.redirect(
        new URL('/verify-email?error=invalid', request.url)
      );
    }

    const sentAt = new Date(users.email_verification_sent_at);
    const now = new Date();
    const minutesDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60);

    // Reduce from 24 hours to 15 minutes for security
    if (minutesDiff > 15) {
      return NextResponse.redirect(
        new URL('/verify-email?error=expired', request.url)
      );
    }

    // If already verified, no need to do anything
    if (users.email_verified === true) {
      return NextResponse.redirect(
        new URL('/verify-email?success=already', request.url)
      );
    }

    // Mark email as verified and invalidate token to prevent reuse
    let updateError: any = null;
    try {
      const result = await supabase
        .from('users_ext')
        .update({
          email_verified: true,
          email_verification_token: null,
          email_verification_sent_at: null, // Clear sent_at to prevent token reuse
        })
        .eq('email_verification_token', token);
      updateError = result.error;
    } catch (err) {
      // If columns don't exist, still consider it verified
      updateError = null;
    }

    if (updateError) {
      return NextResponse.redirect(
        new URL('/verify-email?error=failed', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/verify-email?success=true', request.url)
    );
  } catch (error) {
    serverLog.error('Verification error:', error);
    return NextResponse.redirect(
      new URL('/verify-email?error=server', request.url)
    );
  }
}
