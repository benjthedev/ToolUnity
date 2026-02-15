/**
 * CSRF token utility for frontend
 * Handles generating, storing, and sending CSRF tokens with API requests
 */

const CSRF_COOKIE_NAME = '__csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in cookie and return it
 */
export function setCsrfToken(token: string): string {
  // Store in cookie with secure flags - 24 hours expiry for longer form sessions
  document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; samesite=strict; max-age=86400`;
  return token;
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Ensure CSRF token exists (generate new one if needed)
 */
export function ensureCsrfToken(): string {
  let token = getCsrfToken();
  if (!token) {
    token = generateCsrfToken();
    setCsrfToken(token);
  }
  return token;
}

/**
 * Make a fetch request with CSRF token header
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit & { csrfRequired?: boolean } = {}
): Promise<Response> {
  const { csrfRequired = true, ...fetchOptions } = options;

  // Always include credentials to ensure cookies are sent reliably
  if (!fetchOptions.credentials) {
    fetchOptions.credentials = 'include';
  }

  // For state-changing requests, include CSRF token
  if (csrfRequired && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method || 'GET').toUpperCase())) {
    const token = ensureCsrfToken();
    
    if (!fetchOptions.headers) {
      fetchOptions.headers = {};
    }

    const headers = fetchOptions.headers as Record<string, string>;
    headers[CSRF_HEADER_NAME] = token;
  }

  return fetch(url, fetchOptions);
}

/**
 * Initialize CSRF token on page load
 */
export function initCsrfProtection(): void {
  if (typeof window !== 'undefined') {
    ensureCsrfToken();
  }
}
