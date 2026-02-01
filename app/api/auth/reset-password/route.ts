import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimitByEmail, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import crypto from 'crypto';

/**
 * POST /api/auth/reset-password
 * Request password reset token via email
 * 
 * Body: { email: string }
 * Rate limited: 3 per hour per email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Rate limit by email (3 per hour)
    const rateLimitCheck = checkRateLimitByEmail(
      email,
      RATE_LIMIT_CONFIGS.passwordReset.maxAttempts,
      RATE_LIMIT_CONFIGS.passwordReset.windowMs
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many password reset attempts',
          message: `Please try again in ${Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000)} minutes`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    // Check if user exists (don't leak email existence)
    const { data: user, error: selectError } = await supabase
      .from('users_ext')
      .select('id')
      .eq('email', email)
      .single();

    // Always return generic message to prevent email enumeration
    if (selectError || !user) {
      return NextResponse.json({
        success: true,
        message: 'If email exists, password reset link has been sent',
      });
    }

    // Generate 32-byte cryptographic token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('users_ext')
      .update({
        password_reset_token: resetToken,
        password_reset_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error generating reset token:', updateError);
      return NextResponse.json({
        success: true,
        message: 'If email exists, password reset link has been sent',
      });
    }

    // Send email with reset link via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured - cannot send password reset email');
      return NextResponse.json({
        success: true,
        message: 'If email exists, password reset link has been sent',
      });
    }

    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.toolunity.co.uk';
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'ToolUnity <noreply@toolunity.co.uk>',
          to: email,
          subject: 'Reset Your ToolUnity Password',
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password for ToolUnity.</p>
            <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
            <p style="margin: 20px 0;">
              <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">Or copy this link: ${resetLink}</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          `,
        }),
      });

      const emailData = await emailResponse.json();
      
      if (!emailResponse.ok) {
        console.error('Resend API error:', emailData);
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'If email exists, password reset link has been sent',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/reset-password
 * Verify token and set new password
 * 
 * Body: { email: string, token: string, newPassword: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'Email, token, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find user and verify token
    const { data: user, error: selectError } = await supabase
      .from('users_ext')
      .select('id, user_id, password_reset_token, password_reset_expires_at')
      .eq('email', email)
      .single();

    if (selectError || !user) {
      return NextResponse.json(
        { error: 'Invalid reset link' },
        { status: 400 }
      );
    }

    // Verify token matches
    if (user.password_reset_token !== token) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Verify token hasn't expired (15 minutes)
    const expiresAt = new Date(user.password_reset_expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Reset link has expired' },
        { status: 400 }
      );
    }

    // Get the admin client for auth operations
    const supabaseAdmin = getSupabaseAdmin();
    
    // The user_id in users_ext is the Supabase Auth user ID
    const authUserId = user.user_id;
    
    if (!authUserId) {
      console.error('No user_id found in users_ext for email:', email);
      return NextResponse.json(
        { error: 'User account not properly configured' },
        { status: 400 }
      );
    }
    
    // Update password via Supabase Auth
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      { password: newPassword }
    );

    if (updateAuthError) {
      console.error('Error updating password:', updateAuthError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Clear reset token from database
    const { error: clearError } = await supabase
      .from('users_ext')
      .update({
        password_reset_token: null,
        password_reset_expires_at: null,
      })
      .eq('id', user.id);

    if (clearError) {
      console.error('Error clearing reset token:', clearError);
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
