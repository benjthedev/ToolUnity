import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate CSRF token from request
 * Compares token in header with token in cookies
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
  const cookieHeader = request.headers.get('cookie');
  
  console.log('[CSRF-DEBUG] validateCsrfToken called');
  console.log('[CSRF-DEBUG] Header name looking for:', CSRF_HEADER_NAME);
  console.log('[CSRF-DEBUG] Token from header:', tokenFromHeader?.substring(0, 10) + '...' ?? 'MISSING');
  console.log('[CSRF-DEBUG] Cookie header:', cookieHeader?.substring(0, 50) ?? 'MISSING');
  
  if (!tokenFromHeader) {
    console.log('[CSRF-DEBUG] No token in header - returning false');
    return false;
  }

  // Extract CSRF token from cookies
  let tokenFromCookie: string | null = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME) {
        tokenFromCookie = decodeURIComponent(value);
        break;
      }
    }
  }

  console.log('[CSRF-DEBUG] Token from cookie:', tokenFromCookie?.substring(0, 10) + '...' ?? 'MISSING');
  console.log('[CSRF-DEBUG] Tokens match:', tokenFromHeader === tokenFromCookie);

  // Tokens must match
  return tokenFromHeader === tokenFromCookie;
}

/**
 * Verify CSRF token from request headers
 * Used by API endpoints for form submissions
 */
export async function verifyCsrfToken(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  console.log('[CSRF-DEBUG] verifyCsrfToken called for method:', request.method);
  
  // Skip GET requests (should be idempotent anyway)
  if (request.method === 'GET' || request.method === 'HEAD') {
    console.log('[CSRF-DEBUG] Skipping CSRF check for', request.method);
    return { valid: true };
  }

  // For state-changing requests, require valid CSRF token
  const isValid = validateCsrfToken(request);
  console.log('[CSRF-DEBUG] validateCsrfToken returned:', isValid);
  
  if (!isValid) {
    return {
      valid: false,
      error: 'CSRF token validation failed',
    };
  }

  return { valid: true };
}

/**
 * Verify CSRF token from a string value
 * Used for validating tokens sent in request body
 */
export function validateCsrfTokenString(tokenString: string, request: NextRequest): boolean {
  if (!tokenString) {
    return false;
  }

  const cookieHeader = request.headers.get('cookie');
  
  // Extract CSRF token from cookies
  let tokenFromCookie: string | null = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME) {
        tokenFromCookie = decodeURIComponent(value);
        break;
      }
    }
  }

  // Tokens must match
  return tokenString === tokenFromCookie;
}
