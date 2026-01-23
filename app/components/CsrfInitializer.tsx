'use client';

import { useEffect } from 'react';
import { initCsrfProtection } from '@/app/utils/csrf-client';

/**
 * Client component to initialize CSRF protection on page load
 */
export default function CsrfInitializer() {
  useEffect(() => {
    initCsrfProtection();
  }, []);

  return null;
}
