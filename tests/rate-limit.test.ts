/**
 * Test suite for Rate Limiting
 * Tests that rate limits are correctly enforced
 */

import {
  checkRateLimitByIp,
  checkRateLimitByUserId,
  checkRateLimitByEmail,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

/**
 * TEST 1: First request should be allowed
 * ✅ Should allow
 */
export function testFirstRequestAllowed() {
  console.log('\n🧪 TEST 1: First request allowed');
  console.log('Expected: First request passes rate limit');
  
  const result = checkRateLimitByIp(
    { headers: new Map([['x-forwarded-for', '192.168.1.1']]) } as any,
    5,
    60 * 1000
  );
  
  if (result.allowed && result.remaining === 4) {
    console.log('✅ PASS: First request allowed with 4 remaining');
    return true;
  }
  
  console.log(`❌ FAIL: Expected allowed=true, remaining=4. Got allowed=${result.allowed}, remaining=${result.remaining}`);
  return false;
}

/**
 * TEST 2: Multiple requests within limit should be allowed
 * ✅ Should allow first 5
 */
export function testMultipleRequestsAllowed() {
  console.log('\n🧪 TEST 2: Multiple requests within limit');
  console.log('Expected: 5 requests allowed, 6th rejected');
  
  const ip = '192.168.1.100';
  const maxAttempts = 5;
  
  // Make 5 requests
  for (let i = 0; i < maxAttempts; i++) {
    const result = checkRateLimitByIp(
      { headers: new Map([['x-forwarded-for', ip]]) } as any,
      maxAttempts,
      60 * 1000
    );
    
    if (!result.allowed) {
      console.log(`❌ FAIL: Request ${i + 1} rejected when should be allowed`);
      return false;
    }
  }
  
  // 6th request should fail
  const sixthRequest = checkRateLimitByIp(
    { headers: new Map([['x-forwarded-for', ip]]) } as any,
    maxAttempts,
    60 * 1000
  );
  
  if (!sixthRequest.allowed && sixthRequest.remaining === 0) {
    console.log('✅ PASS: 5 requests allowed, 6th correctly rejected');
    return true;
  }
  
  console.log('❌ FAIL: 6th request should have been rejected');
  return false;
}

/**
 * TEST 3: Different IPs have independent limits
 * ✅ Should allow
 */
export function testIndependentIpLimits() {
  console.log('\n🧪 TEST 3: Independent IP limits');
  console.log('Expected: Different IPs tracked separately');
  
  const maxAttempts = 3;
  
  // IP 1 makes 3 requests
  for (let i = 0; i < maxAttempts; i++) {
    checkRateLimitByIp(
      { headers: new Map([['x-forwarded-for', '192.168.1.1']]) } as any,
      maxAttempts,
      60 * 1000
    );
  }
  
  // IP 2 should still have quota
  const ip2Result = checkRateLimitByIp(
    { headers: new Map([['x-forwarded-for', '192.168.1.2']]) } as any,
    maxAttempts,
    60 * 1000
  );
  
  if (ip2Result.allowed && ip2Result.remaining === 2) {
    console.log('✅ PASS: Different IPs tracked independently');
    return true;
  }
  
  console.log('❌ FAIL: Different IPs should have independent limits');
  return false;
}

/**
 * TEST 4: User ID rate limiting works
 * ✅ Should limit by user
 */
export function testUserIdRateLimit() {
  console.log('\n🧪 TEST 4: User ID rate limiting');
  console.log('Expected: Limits enforced per user ID');
  
  const userId = 'user_test_123';
  const maxAttempts = 2;
  
  // User makes 2 requests
  for (let i = 0; i < maxAttempts; i++) {
    const result = checkRateLimitByUserId(userId, maxAttempts, 60 * 1000);
    if (!result.allowed) {
      console.log(`❌ FAIL: Request ${i + 1} rejected when should be allowed`);
      return false;
    }
  }
  
  // 3rd request should fail
  const thirdRequest = checkRateLimitByUserId(userId, maxAttempts, 60 * 1000);
  
  if (!thirdRequest.allowed) {
    console.log('✅ PASS: User ID rate limit enforced');
    return true;
  }
  
  console.log('❌ FAIL: 3rd request should have been rejected');
  return false;
}

/**
 * TEST 5: Email rate limiting works
 * ✅ Should limit by email
 */
export function testEmailRateLimit() {
  console.log('\n🧪 TEST 5: Email rate limiting');
  console.log('Expected: Limits enforced per email');
  
  const email = 'test@example.com';
  const maxAttempts = 2;
  
  // Email makes 2 requests
  for (let i = 0; i < maxAttempts; i++) {
    const result = checkRateLimitByEmail(email, maxAttempts, 60 * 1000);
    if (!result.allowed) {
      console.log(`❌ FAIL: Request ${i + 1} rejected when should be allowed`);
      return false;
    }
  }
  
  // 3rd request should fail
  const thirdRequest = checkRateLimitByEmail(email, maxAttempts, 60 * 1000);
  
  if (!thirdRequest.allowed) {
    console.log('✅ PASS: Email rate limit enforced');
    return true;
  }
  
  console.log('❌ FAIL: 3rd request should have been rejected');
  return false;
}

/**
 * TEST 6: Reset time is calculated correctly
 * ✅ Should return future timestamp
 */
export function testResetTimeCalculation() {
  console.log('\n🧪 TEST 6: Rate limit reset time');
  console.log('Expected: Reset time is in future');
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  const result = checkRateLimitByIp(
    { headers: new Map([['x-forwarded-for', '192.168.1.200']]) } as any,
    5,
    windowMs
  );
  
  if (result.resetTime > now && result.resetTime <= now + windowMs + 100) {
    console.log('✅ PASS: Reset time calculated correctly');
    return true;
  }
  
  console.log(`❌ FAIL: Reset time ${result.resetTime} not in expected range (${now} - ${now + windowMs})`);
  return false;
}

/**
 * TEST 7: Config presets work correctly
 * ✅ Should have defined configs
 */
export function testConfigPresets() {
  console.log('\n🧪 TEST 7: Rate limit config presets');
  console.log('Expected: All predefined configs present');
  
  const requiredConfigs = [
    'auth',
    'verification',
    'passwordReset',
    'api',
    'borrow',
    'toolCreate',
  ];
  
  let allPresent = true;
  for (const config of requiredConfigs) {
    if (!RATE_LIMIT_CONFIGS[config as keyof typeof RATE_LIMIT_CONFIGS]) {
      console.log(`❌ Missing config: ${config}`);
      allPresent = false;
    }
  }
  
  if (allPresent) {
    console.log(`✅ PASS: All ${requiredConfigs.length} config presets present`);
    return true;
  }
  
  return false;
}

/**
 * RUN ALL TESTS
 */
export async function runRateLimitTests() {
  console.log('\n' + '='.repeat(60));
  console.log('⏱️  RATE LIMITING TESTS');
  console.log('='.repeat(60));
  
  const results = [
    testFirstRequestAllowed(),
    testMultipleRequestsAllowed(),
    testIndependentIpLimits(),
    testUserIdRateLimit(),
    testEmailRateLimit(),
    testResetTimeCalculation(),
    testConfigPresets(),
  ];
  
  const passed = results.filter(r => r).length;
  console.log(`\n📊 Results: ${passed}/${results.length} tests passed`);
  
  if (passed === results.length) {
    console.log('✅ ALL RATE LIMITING TESTS PASSED\n');
  } else {
    console.log('❌ SOME TESTS FAILED\n');
  }
  
  return passed === results.length;
}
