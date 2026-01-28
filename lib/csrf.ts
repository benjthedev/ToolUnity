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
  
  if (!tokenFromHeader) {
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

  // Tokens must match
  return tokenFromHeader === tokenFromCookie;
}

/**
 * Verify CSRF token from request headers
 * Used by API endpoints for form submissions
 */
export async function verifyCsrfToken(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  // Skip GET requests (should be idempotent anyway)
  if (request.method === 'GET' || request.method === 'HEAD') {
    return { valid: true };
  }

  // For state-changing requests, require valid CSRF token
  if (!validateCsrfToken(request)) {
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
