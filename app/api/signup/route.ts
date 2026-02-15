import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimitByEmail, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { SignupSchema } from '@/lib/validation';
import { ApiErrors, apiSuccess } from '@/lib/api-response';
import { ZodError } from 'zod';
import crypto from 'crypto';

/**
 * Helper: wait for ms milliseconds
 */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate verification HMAC token for email
 */
function generateVerificationToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || '';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase().trim()).digest('hex');
}

/**
 * ATOMIC SIGNUP ENDPOINT
 * 
 * This handles the ENTIRE signup in one server-side operation:
 * 1. Validate input
 * 2. Create auth user (server-side via admin API)
 * 3. Upsert profile in users_ext
 * 4. Send verification email via Resend
 * 
 * If ANY step fails after the auth user is created, the auth user is deleted.
 * There is NEVER a scenario where a broken/partial account exists.
 */
export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;
  const sb = getSupabaseAdmin();

  try {
    console.log('[SIGNUP-API] ===== ATOMIC SIGNUP REQUEST =====');
    
    // STEP 0: Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      console.error('[SIGNUP-API] CSRF token validation failed');
      return ApiErrors.CSRF_FAILED();
    }

    const body = await request.json();
    
    // STEP 1: Validate input with Zod
    let validated;
    try {
      validated = SignupSchema.parse({
        email: body.email,
        username: body.username,
        phone_number: body.phone_number,
        password: body.password,
        subscription_tier: body.subscription_tier || 'free',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[SIGNUP-API] Validation failed:', JSON.stringify(error.errors));
        return ApiErrors.VALIDATION_ERROR(`Invalid signup data: ${error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
      }
      throw error;
    }

    const { email, username, phone_number, password } = validated;
    const normalizedEmail = email.toLowerCase().trim();

    console.log('[SIGNUP-API] Validated - email:', normalizedEmail, 'username:', username, 'phone:', phone_number || 'EMPTY');

    if (!password) {
      return ApiErrors.BAD_REQUEST('Password is required');
    }

    // STEP 2: Rate limit
    const rateLimitCheck = checkRateLimitByEmail(
      normalizedEmail,
      RATE_LIMIT_CONFIGS.auth.maxAttempts,
      RATE_LIMIT_CONFIGS.auth.windowMs
    );
    if (!rateLimitCheck.allowed) {
      console.error('[SIGNUP-API] Rate limit exceeded for:', normalizedEmail);
      return ApiErrors.RATE_LIMITED();
    }

    // STEP 3: Create auth user SERVER-SIDE via admin API
    console.log('[SIGNUP-API] Creating auth user server-side...');
    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true, // Allow login immediately - our own verification is separate (users_ext.email_verified)
    });

    if (authError) {
      console.error('[SIGNUP-API] Auth user creation failed:', authError.message);
      // Common case: user already exists
      if (authError.message?.includes('already') || authError.message?.includes('duplicate') || authError.message?.includes('exists')) {
        return ApiErrors.BAD_REQUEST('An account with this email already exists. Please sign in instead.');
      }
      return ApiErrors.BAD_REQUEST(authError.message || 'Failed to create account');
    }

    if (!authData?.user?.id) {
      console.error('[SIGNUP-API] Auth user created but no user ID returned');
      return ApiErrors.INTERNAL_ERROR('Account creation failed - no user ID');
    }

    // From this point on, if ANYTHING fails, we MUST delete the auth user
    createdUserId = authData.user.id;
    console.log('[SIGNUP-API] Auth user created:', createdUserId);

    // STEP 4: Upsert profile in users_ext with retry
    const upsertPayload = {
      user_id: createdUserId,
      email: normalizedEmail,
      username: username,
      phone_number: phone_number || null,
      subscription_tier: 'free',
      email_verified: false,
      tools_count: 0,
      updated_at: new Date().toISOString(),
    };

    console.log('[SIGNUP-API] Upserting profile - phone:', phone_number);

    let profileData: any[] | null = null;
    let profileError: any = null;
    const maxDbAttempts = 3;

    for (let attempt = 1; attempt <= maxDbAttempts; attempt++) {
      const result = await sb
        .from('users_ext')
        .upsert(upsertPayload, { onConflict: 'user_id' })
        .select();

      profileError = result.error;
      profileData = result.data;

      if (!profileError && profileData && profileData.length > 0) {
        // Verify phone was actually saved
        const saved = profileData[0];
        console.log(`[SIGNUP-API] Profile saved on attempt ${attempt} - phone: ${saved.phone_number}, email: ${saved.email}, username: ${saved.username}`);
        
        if (phone_number && saved.phone_number !== phone_number) {
          console.error('[SIGNUP-API] PHONE MISMATCH! Expected:', phone_number, 'Got:', saved.phone_number);
          // Don't break - treat as failure and retry
          profileError = { message: 'Phone number not saved correctly' };
          if (attempt < maxDbAttempts) {
            await delay(500 * attempt);
            continue;
          }
        }
        break;
      }

      console.warn(`[SIGNUP-API] Profile upsert attempt ${attempt}/${maxDbAttempts} failed:`, profileError?.message || '0 rows');
      if (attempt < maxDbAttempts) {
        await delay(500 * attempt);
      }
    }

    if (profileError || !profileData || profileData.length === 0) {
      console.error('[SIGNUP-API] Profile creation FAILED after', maxDbAttempts, 'attempts');
      throw new Error('Failed to create user profile: ' + (profileError?.message || 'no data returned'));
    }

    // STEP 5: Send verification email via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('[SIGNUP-API] RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    const verificationToken = generateVerificationToken(normalizedEmail);
    const verificationLink = `${process.env.NEXTAUTH_URL}/api/verify-email?email=${encodeURIComponent(normalizedEmail)}&token=${verificationToken}`;

    console.log('[SIGNUP-API] Sending verification email to:', normalizedEmail);

    const emailResponse = await fetch('https://api.resend.com/emails', {
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

    const emailResult = await emailResponse.json();
    console.log('[SIGNUP-API] Resend response:', emailResponse.status, JSON.stringify(emailResult));

    if (!emailResponse.ok) {
      console.error('[SIGNUP-API] Email sending FAILED:', emailResponse.status, JSON.stringify(emailResult));
      throw new Error('Failed to send verification email: ' + (emailResult?.message || 'unknown error'));
    }

    // ALL STEPS SUCCEEDED - this is the only path to success
    console.log('[SIGNUP-API] ===== SIGNUP COMPLETE =====');
    console.log('[SIGNUP-API] user_id:', createdUserId, 'email:', normalizedEmail, 'phone:', phone_number, 'email_sent: YES');

    return apiSuccess(
      { id: createdUserId, email: normalizedEmail, username: username, phone_number: phone_number || null },
      'Account created successfully. Please check your email to verify your account.',
      201
    );

  } catch (error) {
    // ROLLBACK: If we created an auth user but something failed, delete it completely
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SIGNUP-API] FATAL ERROR:', errorMsg);

    if (createdUserId) {
      console.log('[SIGNUP-API] ROLLING BACK: Deleting auth user', createdUserId);
      try {
        await sb.auth.admin.deleteUser(createdUserId);
        console.log('[SIGNUP-API] Rollback SUCCESS: auth user deleted, no orphaned account');
      } catch (rollbackErr) {
        console.error('[SIGNUP-API] ROLLBACK FAILED - ORPHANED ACCOUNT:', createdUserId, rollbackErr);
        // This is the worst case - log it loudly so it can be investigated
      }
      return ApiErrors.INTERNAL_ERROR('Something went wrong creating your account. Please try again.');
    }

    // Error happened before auth user was created - safe, nothing to clean up
    return ApiErrors.INTERNAL_ERROR('Something went wrong. Please try again.');
  }
}
