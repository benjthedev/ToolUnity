import { NextRequest } from 'next/server';

/**
 * Simple in-memory rate limiter
 * In production, consider using Redis for distributed rate limiting
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.attempts.entries()) {
        if (data.resetTime < now) {
          this.attempts.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed under rate limit
   * @param identifier Unique identifier (IP, user ID, email, etc.)
   * @param maxAttempts Maximum attempts allowed
   * @param windowMs Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(
    identifier: string,
    maxAttempts: number = 10,
    windowMs: number = 60 * 1000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const data = this.attempts.get(identifier);

    // If no prior attempts, start new window
    if (!data || data.resetTime < now) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
    }

    // Window still active
    data.count += 1;

    if (data.count > maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime,
      };
    }

    return {
      allowed: true,
      remaining: maxAttempts - data.count,
      resetTime: data.resetTime,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter();

/**
 * Get client IP from request (handles proxies)
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Rate limit by IP address
 */
export function checkRateLimitByIp(
  request: NextRequest,
  maxAttempts: number = 10,
  windowMs: number = 60 * 1000
) {
  const ip = getClientIp(request);
  return globalRateLimiter.check(`ip:${ip}`, maxAttempts, windowMs);
}

/**
 * Rate limit by user ID (for authenticated endpoints)
 */
export function checkRateLimitByUserId(
  userId: string,
  maxAttempts: number = 10,
  windowMs: number = 60 * 1000
) {
  return globalRateLimiter.check(`user:${userId}`, maxAttempts, windowMs);
}

/**
 * Rate limit by email (for signup/password reset)
 */
export function checkRateLimitByEmail(
  email: string,
  maxAttempts: number = 3,
  windowMs: number = 60 * 60 * 1000 // 1 hour default
) {
  return globalRateLimiter.check(`email:${email.toLowerCase()}`, maxAttempts, windowMs);
}

/**
 * Common rate limit configs
 */
export const RATE_LIMIT_CONFIGS = {
  // Auth endpoints: 5 attempts per minute per IP
  auth: { maxAttempts: 5, windowMs: 60 * 1000 },

  // Verification email: 3 attempts per hour per email
  verification: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },

  // Password reset: 3 attempts per hour per email
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },

  // API requests: 100 per minute per IP (generous)
  api: { maxAttempts: 100, windowMs: 60 * 1000 },

  // Borrow requests: 10 per hour per user
  borrow: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },

  // Tool creation: 5 per hour per user
  toolCreate: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },

  // Tool update: 10 per hour per user
  toolUpdate: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },
};
