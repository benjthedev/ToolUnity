import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { supabase } from '@/lib/supabase';
import { UpdateToolSchema } from '@/lib/validation';
import { checkRateLimitByUserId, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { validateCsrfTokenString } from '@/lib/csrf';

// Simple HTML sanitization for serverless environments
function sanitizeHtml(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * PUT /api/tools/update
 * Update an existing tool (owner only)
 * 
 * Protected by:
 * - Authentication (must be logged in)
 * - CSRF token validation
 * - Rate limiting (10/hour per user)
 * - Authorization (must be tool owner)
 * - Input validation (Zod schema)
 * - XSS protection (description sanitized)
 */
export async function PUT(request: NextRequest) {
  try {
    // Step 1: Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in' },
        { status: 401 }
      );
    }

    // Step 2: Validate CSRF token
    const body = await request.json();
    const csrfToken = body.csrf_token;
    
    if (!csrfToken || !validateCsrfTokenString(csrfToken, request)) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    // Step 3: Rate limiting
    const rateLimitCheck = checkRateLimitByUserId(
      session.user.id,
      RATE_LIMIT_CONFIGS.toolUpdate.maxAttempts,
      RATE_LIMIT_CONFIGS.toolUpdate.windowMs
    );

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many update attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate data
    const toolId = request.nextUrl.searchParams.get('toolId');
    if (!toolId) {
      return NextResponse.json(
        { error: 'Missing toolId parameter' },
        { status: 400 }
      );
    }

    // Parse and validate data
    const updateData = UpdateToolSchema.parse({
      name: body.name,
      description: body.description,
      category: body.category,
      condition: body.condition,
      tool_value: body.tool_value,
      daily_rate: body.daily_rate,
      postcode: body.postcode,
      image_url: body.image_url,
    });

    // Step 5: Sanitize description for XSS protection
    const sanitizedDescription = updateData.description 
      ? sanitizeHtml(updateData.description)
      : undefined;

    // Step 6: Check ownership
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('owner_id')
      .eq('id', toolId)
      .is('deleted_at', null)
      .single();

    if (toolError || !tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    if (tool.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this tool' },
        { status: 403 }
      );
    }

    // Step 7: Update tool
    const updatePayload: any = {};
    
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.category !== undefined) updatePayload.category = updateData.category;
    if (sanitizedDescription !== undefined) updatePayload.description = sanitizedDescription;
    if (updateData.condition !== undefined) updatePayload.condition = updateData.condition.toLowerCase();
    if (updateData.tool_value !== undefined) updatePayload.tool_value = updateData.tool_value;
    if (updateData.postcode !== undefined) updatePayload.postcode = updateData.postcode;
    if (updateData.image_url !== undefined) updatePayload.image_url = updateData.image_url;
    
    // Handle daily_rate - might not exist in database yet
    if (updateData.daily_rate !== undefined) {
      updatePayload.daily_rate = updateData.daily_rate;
    }
    
    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedTool, error: updateError } = await supabase
      .from('tools')
      .update(updatePayload)
      .eq('id', toolId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { 
          error: 'Failed to update tool', 
          details: updateError.message,
          code: updateError.code,
          hint: updateError.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Tool updated successfully',
        tool: updatedTool,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Tool update error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation failed', reason: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
