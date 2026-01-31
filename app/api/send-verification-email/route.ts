import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimitByEmail, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { serverLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Rate limit email verification (3 per hour per email)
    const rateLimitCheck = checkRateLimitByEmail(
      email,
      RATE_LIMIT_CONFIGS.verification.maxAttempts,
      RATE_LIMIT_CONFIGS.verification.windowMs
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many verification email requests',
          reason: 'rate_limited',
          message: `Please try again in ${Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000)} minutes`,
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // If userId is provided, update the token in database
    if (body.userId) {
      const { error: updateError } = await supabase
        .from('users_ext')
        .update({
          email_verification_token: verificationToken,
          email_verification_sent_at: new Date().toISOString(),
        })
        .eq('user_id', body.userId);

      if (updateError) {
        serverLog.error('Error updating verification token:', updateError);
      }
    } else {
      // If no userId, try to find user by email and update token
      try {
        const { error: updateError } = await supabase
          .from('users_ext')
          .update({
            email_verification_token: verificationToken,
            email_verification_sent_at: new Date().toISOString(),
          })
          .eq('email', email);

        if (updateError) {
          serverLog.error('Error updating verification token:', updateError);
        }
      } catch (err) {
        serverLog.error('Error finding user by email:', err);
      }
    }

    // For development/testing: Create a verification link that auto-verifies
    // Use Supabase's native email confirmation link instead of custom token
    const verificationLink = `${process.env.NEXTAUTH_URL}/auth/callback`;

    // Send verification email using Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        // Get the user to trigger Supabase to send an email confirmation
        const { data: resendData, error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        });

        if (resendError) {
          throw new Error(`Supabase resend error: ${resendError.message}`);
        }

        return NextResponse.json(
          { message: 'Verification email sent' },
          { status: 200 }
        );
      } catch (emailError) {
        serverLog.error('Email sending error:', emailError);
        // Fallback: send via Resend directly
        try {
          const manualLink = `${process.env.NEXTAUTH_URL}/auth/callback`;
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
                  <a href="${manualLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px;">
                    Verify Email Address
                  </a>
                </p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't sign up for ToolUnity, you can ignore this email.</p>
              `,
            }),
          });
          
          const responseData = await response.json();
          
          if (!response.ok) {
            throw new Error(`Resend API error: ${response.status} ${JSON.stringify(responseData)}`);
          }

          return NextResponse.json(
            { message: 'Verification email sent' },
            { status: 200 }
          );
        } catch (fallbackError) {
          serverLog.error('Resend fallback error:', fallbackError);
          return NextResponse.json(
            { 
              error: 'Failed to send verification email. Please check that email service is configured.',
              requiresEmailService: true
            },
            { status: 500 }
          );
        }
      }
    } else {
      // No email service configured - don't auto-verify
      return NextResponse.json(
        { 
          error: 'Email service not configured. Please add RESEND_API_KEY to .env.local to send verification emails.',
          requiresEmailService: true
        },
        { status: 500 }
      );
    }
  } catch (error) {
    serverLog.error('Verification endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
