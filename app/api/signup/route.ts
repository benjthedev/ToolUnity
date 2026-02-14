import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimitByEmail, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { SignupSchema } from '@/lib/validation';
import { serverLog } from '@/lib/logger';
import { ApiErrors, apiSuccess } from '@/lib/api-response';
import { ZodError } from 'zod';

let supabaseAdmin: any = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  return supabaseAdmin;
}

let supabase: any = null;

function getSupabase() {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
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
    console.log('[SIGNUP-API] Body received, attempting to parse:', body.email);
    
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
      console.log('[SIGNUP-API] Validation passed for:', body.email);
    } catch (error) {
      console.error('[SIGNUP-API] Validation failed:', error);
      if (error instanceof ZodError) {
        return ApiErrors.VALIDATION_ERROR('Invalid signup data provided');
      }
      throw error;
    }

    // Use validated data (not raw body) for all fields
    const { email, username, phone_number } = validated;
    const user_id = body.user_id;

    console.log('[SIGNUP-API] Validated data - email:', email, 'username:', username, 'phone_number:', phone_number || 'EMPTY');
    console.log('[SIGNUP-API] Processing signup for user_id:', user_id, 'email:', email, 'phone:', phone_number || 'EMPTY');

    if (!user_id || typeof user_id !== 'string') {
      console.error('[SIGNUP-API] Missing or invalid user_id');
      return ApiErrors.BAD_REQUEST('Missing user_id');
    }

    // Validate user_id is a valid UUID format (basic sanity check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user_id)) {
      console.error('[SIGNUP-API] Invalid user_id format:', user_id);
      return ApiErrors.BAD_REQUEST('Invalid user_id format');
    }

    // Rate limit signup by email
    const rateLimitCheck = checkRateLimitByEmail(
      email,
      RATE_LIMIT_CONFIGS.auth.maxAttempts,
      RATE_LIMIT_CONFIGS.auth.windowMs
    );

    if (!rateLimitCheck.allowed) {
      console.error('[SIGNUP-API] Rate limit exceeded for:', email);
      return ApiErrors.RATE_LIMITED();
    }

    // Upsert user profile directly (trigger may have already created a partial profile)
    const sb = getSupabase();
    console.log('[SIGNUP-API] Upserting profile for user_id:', user_id);
    console.log('[SIGNUP-API] Data being upserted:', {
      user_id,
      email,
      username,
      phone_number: phone_number || null,
      subscription_tier: 'free',
      email_verified: false,
    });

    const upsertPayload = {
      user_id: user_id,
      email: email,
      username: username,
      phone_number: phone_number && phone_number.trim() ? phone_number : null,
      subscription_tier: 'free',
      email_verified: false,
      tools_count: 0,
      created_at: new Date().toISOString(),
    };

    const { error: profileError, data: profileData } = await sb.from('users_ext').upsert(upsertPayload, {
      onConflict: 'user_id',
    }).select();

    if (profileError) {
      console.error('[SIGNUP-API] Profile upsert error:', profileError);
      console.error('[SIGNUP-API] Full error object:', JSON.stringify(profileError));
      return ApiErrors.BAD_REQUEST(profileError.message || 'Failed to create profile');
    }

    console.log('[SIGNUP-API] User profile created/updated successfully');
    console.log('[SIGNUP-API] Profile data returned:', profileData);

    // Supabase will automatically send verification email and keep email unverified
    // until user clicks the verification link

    // Return success with detailed info for debugging
    return apiSuccess(
      { id: user_id, email: email, username: username, phone_number: phone_number || null },
      'User profile created successfully. Verification email will be sent separately.',
      201
    );
  } catch (error) {
    console.error('[SIGNUP-API] Caught error:', error);
    return ApiErrors.INTERNAL_ERROR();
  }
}
