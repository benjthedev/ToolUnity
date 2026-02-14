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
    console.log('[SIGNUP-API] Raw body fields:', {
      email: body.email,
      username: body.username,
      phone_number: body.phone_number ? `${body.phone_number.substring(0, 3)}...` : 'MISSING',
      password: body.password ? '***' : 'MISSING',
    });
    
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
      if (error instanceof ZodError) {
        console.error('[SIGNUP-API] Zod validation errors:');
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.code} - ${err.message}`);
        });
        console.error('[SIGNUP-API] Full validation error object:', JSON.stringify(error.errors, null, 2));
        return ApiErrors.VALIDATION_ERROR(`Invalid signup data: ${error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
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

    // Update user profile - the auth trigger already created a partial row in users_ext
    const sb = getSupabase();
    console.log('[SIGNUP-API] Updating profile for user_id:', user_id);
    console.log('[SIGNUP-API] Data being updated:', {
      email,
      username,
      phone_number: phone_number || null,
      subscription_tier: 'free',
      email_verified: false,
    });

    const updatePayload = {
      email: email,
      username: username,
      phone_number: phone_number,
      subscription_tier: 'free',
      email_verified: false,
      updated_at: new Date().toISOString(),
    };

    // Use UPDATE instead of UPSERT to avoid trigger conflicts with the auth-created row
    const { error: profileError, data: profileData } = await sb
      .from('users_ext')
      .update(updatePayload)
      .eq('user_id', user_id)
      .select();

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
