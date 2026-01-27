import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization utilities for XSS prevention
 */

// Configuration for DOMPurify
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
};

/**
 * Sanitize user-generated content to prevent XSS
 * Used for tool descriptions, reviews, messages, etc.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}

/**
 * Sanitize plain text (strips all HTML)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Escape HTML entities
 * Used for attribute values
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
