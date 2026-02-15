import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimitByEmail, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { SignupSchema } from '@/lib/validation';
import { serverLog } from '@/lib/logger';
import { ApiErrors, apiSuccess } from '@/lib/api-response';
import { ZodError } from 'zod';

/**
 * Helper: wait for ms milliseconds
 */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    console.log('[SIGNUP-API] Request received');
    
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      console.error('[SIGNUP-API] CSRF token validation failed');
      return ApiErrors.CSRF_FAILED();
    }

    const body = await request.json();
    console.log('[SIGNUP-API] Body received for:', body.email);
    
    // Validate input with Zod
    let validated;
    try {
      validated = SignupSchema.parse({
        email: body.email,
        username: body.username,
        phone_number: body.phone_number,
        password: body.password,
        subscription_tier: body.subscription_tier || 'free',
      });
      console.log('[SIGNUP-API] Validation passed');
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[SIGNUP-API] Zod validation errors:', JSON.stringify(error.errors));
        return ApiErrors.VALIDATION_ERROR(`Invalid signup data: ${error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
      }
      throw error;
    }

    // Use validated data (not raw body) for all fields
    const { email, username, phone_number } = validated;
    const user_id = body.user_id;
    // Normalize email to lowercase to avoid case sensitivity issues
    const normalizedEmail = email.toLowerCase().trim();

    console.log('[SIGNUP-API] Validated - email:', normalizedEmail, 'username:', username, 'phone:', phone_number || 'EMPTY', 'user_id:', user_id);

    if (!user_id || typeof user_id !== 'string') {
      console.error('[SIGNUP-API] Missing or invalid user_id');
      return ApiErrors.BAD_REQUEST('Missing user_id');
    }

    // Validate user_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error('[SIGNUP-API] Invalid user_id format:', user_id);
      return ApiErrors.BAD_REQUEST('Invalid user_id format');
    }

    // Rate limit signup by email
    const rateLimitCheck = checkRateLimitByEmail(
      normalizedEmail,
      RATE_LIMIT_CONFIGS.auth.maxAttempts,
      RATE_LIMIT_CONFIGS.auth.windowMs
    );

    if (!rateLimitCheck.allowed) {
      console.error('[SIGNUP-API] Rate limit exceeded for:', normalizedEmail);
      return ApiErrors.RATE_LIMITED();
    }

    // Use admin client to bypass RLS (anon client has no server-side session)
    const sb = getSupabaseAdmin();

    // UPSERT payload - handles BOTH cases:
    // 1. Trigger already created the row → UPSERT updates it
    // 2. Trigger hasn't created the row yet (race condition) → UPSERT inserts it
    const upsertPayload = {
      user_id: user_id,
      email: normalizedEmail,
      username: username,
      phone_number: phone_number || null,
      subscription_tier: 'free',
      email_verified: false,
      tools_count: 0,
      updated_at: new Date().toISOString(),
    };

    console.log('[SIGNUP-API] Upserting profile with phone:', phone_number, 'type:', typeof phone_number);

    // Retry logic - handles transient DB issues and trigger timing
    let profileData: any[] | null = null;
    let profileError: any = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await sb
        .from('users_ext')
        .upsert(upsertPayload, { onConflict: 'user_id' })
        .select();

      profileError = result.error;
      profileData = result.data;

      if (profileError) {
        console.error(`[SIGNUP-API] Upsert attempt ${attempt}/${maxAttempts} error:`, profileError.message, profileError.code);
        if (attempt < maxAttempts) {
          await delay(500 * attempt); // 500ms, 1000ms backoff
          continue;
        }
        break;
      }

      // Verify rows were actually affected
      if (profileData && profileData.length > 0) {
        console.log(`[SIGNUP-API] Upsert succeeded on attempt ${attempt}, rows:`, profileData.length);
        
        // CRITICAL: Verify phone was actually saved
        const savedPhone = profileData[0]?.phone_number;
        const savedEmail = profileData[0]?.email;
        console.log('[SIGNUP-API] Verified saved data - phone:', savedPhone, 'email:', savedEmail, 'username:', profileData[0]?.username);
        
        if (phone_number && !savedPhone) {
          console.error('[SIGNUP-API] CRITICAL: phone_number was NOT saved despite successful upsert! Expected:', phone_number, 'Got:', savedPhone);
        }
        break;
      }

      // 0 rows returned - this should not happen with UPSERT but handle it
      console.warn(`[SIGNUP-API] Upsert attempt ${attempt}/${maxAttempts} returned 0 rows`);
      if (attempt < maxAttempts) {
        await delay(500 * attempt);
      }
    }

    // Final check: did the profile get created?
    if (profileError || !profileData || profileData.length === 0) {
      console.error('[SIGNUP-API] Profile upsert FAILED after', maxAttempts, 'attempts. Error:', profileError?.message || 'no rows returned');
      
      // ROLLBACK: Delete the auth user since profile creation failed
      console.log('[SIGNUP-API] Rolling back: deleting auth user', user_id);
      try {
        await sb.auth.admin.deleteUser(user_id);
        console.log('[SIGNUP-API] Rollback successful: auth user deleted');
      } catch (deleteError) {
        console.error('[SIGNUP-API] Rollback failed:', deleteError);
      }
      
      return ApiErrors.BAD_REQUEST(profileError?.message || 'Failed to create profile - please try again');
    }

    console.log('[SIGNUP-API] Profile created successfully for user_id:', user_id);

    return apiSuccess(
      { id: user_id, email: normalizedEmail, username: username, phone_number: phone_number || null },
      'User profile created successfully. Verification email will be sent separately.',
      201
    );
  } catch (error) {
    console.error('[SIGNUP-API] Caught error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
