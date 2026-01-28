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
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return ApiErrors.CSRF_FAILED();
    }

    const body = await request.json();
    
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
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiErrors.VALIDATION_ERROR('Invalid signup data provided');
      }
      throw error;
    }

    const { user_id, email, username, phone_number, subscription_tier } = body;

    // Rate limit signup by email
    const rateLimitCheck = checkRateLimitByEmail(
      email,
      RATE_LIMIT_CONFIGS.auth.maxAttempts,
      RATE_LIMIT_CONFIGS.auth.windowMs
    );

    if (!rateLimitCheck.allowed) {
      return ApiErrors.RATE_LIMITED();
    }

    // Create user profile
    const sb = getSupabase();
    const { error: profileError } = await sb.from('users_ext').insert({
      user_id: user_id,
      email: email,
      username: username,
      phone_number: phone_number || null,
      subscription_tier: subscription_tier || 'free',
      tools_count: 0,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      return ApiErrors.BAD_REQUEST(profileError.message);
    }

    // Mark user as email confirmed using service role
    const sbAdmin = getSupabaseAdmin();
    if (sbAdmin) {
      try {
        const { data, error: confirmError } = await sbAdmin.auth.admin.updateUserById(user_id, {
          email_confirm: true,
        });
        if (confirmError) {
          // Email confirmation failed but account created
        } else {
        }
      } catch (e) {
        // Log suppressed - development only
      }
    } else {
      // Service role key not configured
    }

    return apiSuccess(
      { id: user_id, email: email, username: username },
      'User profile created successfully',
      201
    );
  } catch (error) {
    return ApiErrors.INTERNAL_ERROR();
  }
}
