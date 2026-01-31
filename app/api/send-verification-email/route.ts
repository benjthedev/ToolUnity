import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyCsrfToken } from '@/lib/csrf';
import { serverLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Send verification email via Resend
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const verificationLink = `${process.env.NEXTAUTH_URL}/api/verify-email?email=${encodeURIComponent(email)}`;

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

    if (!response.ok) {
      throw new Error(`Resend error: ${JSON.stringify(responseData)}`);
    }

    return NextResponse.json({ message: 'Verification email sent' }, { status: 200 });
  } catch (error) {
    serverLog.error('Send verification email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
