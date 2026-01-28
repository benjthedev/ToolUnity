/**
 * API Error Response Standards
 * Ensures consistent error response format across all endpoints
 */

import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  error: string;
  reason?: string;
  message?: string;
  status?: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Returns a standardized error response
 */
export function apiError(
  message: string,
  statusCode: number = 500,
  reason?: string
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    error: message,
    ...(reason && { reason }),
    status: statusCode,
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Returns a standardized success response
 */
export function apiSuccess<T = any>(
  data?: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  };

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Common API error helpers
 */
export const ApiErrors = {
  UNAUTHORIZED: () => apiError('Unauthorized', 401, 'auth_required'),
  FORBIDDEN: () => apiError('Access denied', 403, 'insufficient_permissions'),
  NOT_FOUND: (resource: string = 'Resource') =>
    apiError(`${resource} not found`, 404, 'not_found'),
  BAD_REQUEST: (message: string = 'Invalid request') =>
    apiError(message, 400, 'bad_request'),
  CSRF_FAILED: () => apiError('CSRF token validation failed', 403, 'csrf_invalid'),
  RATE_LIMITED: () => apiError('Too many requests', 429, 'rate_limited'),
  VALIDATION_ERROR: (message: string = 'Validation failed') =>
    apiError(message, 400, 'validation_failed'),
  INTERNAL_ERROR: (message: string = 'Internal server error') =>
    apiError(message, 500, 'internal_error'),
};
