/**
 * Server-side logging utilities
 * Uses console only in development, skips in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const serverLog = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '');
    }
    // In production, could send to Sentry, DataDog, etc.
  },
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
};
