export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getSupabase } from '@/lib/supabase';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { CreateToolSchema } from '@/lib/validation';
import { serverLog } from '@/lib/logger';
import { ZodError } from 'zod';

/**
 * POST /api/tools/create
 * Create a new tool with validation and rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfCheck = await verifyCsrfToken(request);
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: 'CSRF token validation failed', code: 'csrf_invalid' },
        { status: 403 }
      );
    }

    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'not_authenticated' },
        { status: 401 }
      );
    }

    // Check email verification
    if (!session.user.emailVerified) {
      return NextResponse.json(
        { error: 'Email verification required', code: 'email_not_verified' },
        { status: 403 }
      );
    }

    // Rate limit: 5 tools per hour per user
    const rateLimitCheck = checkRateLimitByUserId(
      session.user.id,
      RATE_LIMIT_CONFIGS.borrow.maxAttempts, // Reuse borrow rate limit (10/hour)
      RATE_LIMIT_CONFIGS.borrow.windowMs
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many tool creations',
          code: 'rate_limited',
          message: `Please wait ${Math.ceil((rateLimitCheck.resetTime - Date.now()) / 60000)} minutes before creating another tool`,
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)) } }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validated = CreateToolSchema.parse({
      name: body.name,
      category: body.category,
      description: body.description,
      condition: body.condition,
      daily_rate: body.daily_rate,
      tool_value: body.tool_value,
      images: body.images,
    });

    // Insert tool into database
    const { data: tool, error: insertError } = await getSupabase()
      .from('tools')
      .insert([
        {
          name: validated.name,
          category: validated.category,
          description: validated.description,
          condition: validated.condition,
          daily_rate: validated.daily_rate,
          tool_value: validated.tool_value || (validated.daily_rate * 30), // Default to 30 days of rental value if not provided
          postcode: body.postcode, // Additional field not in schema
          image_url: validated.images?.[0] || null,
          owner_id: session.user.id,
          available: true,
        },
      ])
      .select();

    if (insertError || !tool || tool.length === 0) {
      serverLog.error('Tool creation database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create tool', code: 'insert_failed' },
        { status: 500 }
      );
    }

    // Update user's tools_count
    const { error: countError } = await getSupabase()
      .from('users_ext')
      .update({ tools_count: (body.toolsCount || 0) + 1 })
      .eq('user_id', session.user.id);

    if (countError) {
      serverLog.error('Error updating tools count:', countError);
      // Don't fail the request - tool was created successfully
    }

    return NextResponse.json(
      {
        message: 'Tool created successfully',
        tool: tool[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'validation_error',
          issues: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    serverLog.error('Tool creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'internal_error' },
      { status: 500 }
    );
  }
}
