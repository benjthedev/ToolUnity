/**
 * Test suite for CSRF Protection
 * Tests that CSRF tokens are generated, validated, and enforced
 */

import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';
import { NextRequest } from 'next/server';

/**
 * TEST 1: CSRF token generation produces 32-byte hex string
 * ✅ Should generate valid token
 */
export function testTokenGeneration() {
  console.log('\n🧪 TEST 1: CSRF token generation');
  console.log('Expected: 32-byte hex string (64 chars)');
  
  const token = generateCsrfToken();
  
  if (token && token.length === 64 && /^[0-9a-f]+$/.test(token)) {
    console.log(`✅ PASS: Generated valid token: ${token.substring(0, 16)}...`);
    return true;
  }
  
  console.log(`❌ FAIL: Invalid token format: ${token}`);
  return false;
}

/**
 * TEST 2: Different tokens are generated on each call
 * ✅ Should be random
 */
export function testTokenUniqueness() {
  console.log('\n🧪 TEST 2: CSRF token uniqueness');
  console.log('Expected: Multiple calls produce different tokens');
  
  const token1 = generateCsrfToken();
  const token2 = generateCsrfToken();
  const token3 = generateCsrfToken();
  
  if (token1 !== token2 && token2 !== token3 && token1 !== token3) {
    console.log('✅ PASS: All tokens are unique');
    return true;
  }
  
  console.log('❌ FAIL: Tokens are not random');
  return false;
}

/**
 * TEST 3: Matching header and cookie tokens validate successfully
 * ✅ Should return true
 */
export function testValidTokenMatch() {
  console.log('\n🧪 TEST 3: Valid token validation');
  console.log('Expected: Matching tokens validate successfully');
  
  const token = generateCsrfToken();
  
  // Create mock request with matching token
  const mockRequest = {
    headers: new Map([
      ['x-csrf-token', token],
      ['cookie', `__csrf_token=${encodeURIComponent(token)}`],
    ]),
    get: (key: string) => {
      const val = mockRequest.headers.get(key);
      return val as string | null;
    },
  } as unknown as NextRequest;
  
  const isValid = validateCsrfToken(mockRequest);
  
  if (isValid) {
    console.log('✅ PASS: Matching tokens validate successfully');
    return true;
  }
  
  console.log('❌ FAIL: Matching tokens failed validation');
  return false;
}

/**
 * TEST 4: Missing header token fails validation
 * ✅ Should return false
 */
export function testMissingHeaderToken() {
  console.log('\n🧪 TEST 4: Missing header token rejection');
  console.log('Expected: Missing header rejects request');
  
  const token = generateCsrfToken();
  
  // Create mock request WITHOUT header token
  const mockRequest = {
    headers: new Map([
      // Missing x-csrf-token header
      ['cookie', `__csrf_token=${encodeURIComponent(token)}`],
    ]),
    get: (key: string) => mockRequest.headers.get(key) as string | null,
  } as unknown as NextRequest;
  
  const isValid = validateCsrfToken(mockRequest);
  
  if (!isValid) {
    console.log('✅ PASS: Missing header token correctly rejected');
    return true;
  }
  
  console.log('❌ FAIL: Missing header should have been rejected');
  return false;
}

/**
 * TEST 5: Mismatched tokens fail validation
 * ✅ Should return false
 */
export function testMismatchedTokens() {
  console.log('\n🧪 TEST 5: Mismatched token rejection');
  console.log('Expected: Different tokens fail validation');
  
  const headerToken = generateCsrfToken();
  const cookieToken = generateCsrfToken();
  
  // Ensure they're different
  if (headerToken === cookieToken) {
    console.log('⚠️  SKIP: Generated same token twice (unlikely but happened)');
    return true;
  }
  
  // Create mock request with DIFFERENT tokens
  const mockRequest = {
    headers: new Map([
      ['x-csrf-token', headerToken],
      ['cookie', `__csrf_token=${encodeURIComponent(cookieToken)}`],
    ]),
    get: (key: string) => mockRequest.headers.get(key) as string | null,
  } as unknown as NextRequest;
  
  const isValid = validateCsrfToken(mockRequest);
  
  if (!isValid) {
    console.log('✅ PASS: Mismatched tokens correctly rejected');
    return true;
  }
  
  console.log('❌ FAIL: Mismatched tokens should have been rejected');
  return false;
}

/**
 * TEST 6: Missing cookie token fails validation
 * ✅ Should return false
 */
export function testMissingCookieToken() {
  console.log('\n🧪 TEST 6: Missing cookie token rejection');
  console.log('Expected: Missing cookie rejects request');
  
  const token = generateCsrfToken();
  
  // Create mock request WITHOUT cookie
  const mockRequest = {
    headers: new Map([
      ['x-csrf-token', token],
      // Missing cookie
    ]),
    get: (key: string) => mockRequest.headers.get(key) as string | null,
  } as unknown as NextRequest;
  
  const isValid = validateCsrfToken(mockRequest);
  
  if (!isValid) {
    console.log('✅ PASS: Missing cookie token correctly rejected');
    return true;
  }
  
  console.log('❌ FAIL: Missing cookie should have been rejected');
  return false;
}

/**
 * RUN ALL TESTS
 */
export async function runCsrfTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 CSRF PROTECTION TESTS');
  console.log('='.repeat(60));
  
  const results = [
    testTokenGeneration(),
    testTokenUniqueness(),
    testValidTokenMatch(),
    testMissingHeaderToken(),
    testMismatchedTokens(),
    testMissingCookieToken(),
  ];
  
  const passed = results.filter(r => r).length;
  console.log(`\n📊 Results: ${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('✅ ALL CSRF TESTS PASSED\n');
  } else {
    console.log('❌ SOME TESTS FAILED\n');
  }
  
  return passed === results.length;
}
