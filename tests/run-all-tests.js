/**
 * Master test runner for all security fixes
 * Run: node tests/run-all-tests.js
 */

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🔒 SECURITY FIXES - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(70));
  console.log('\nTesting 3 critical security fixes:');
  console.log('1. Stripe Webhook Signature Verification');
  console.log('2. CSRF Protection');
  console.log('3. Rate Limiting\n');

  try {
    // Import test modules
    const { runWebhookSecurityTests } = await import('./webhook-security.test');
    const { runCsrfTests } = await import('./csrf-security.test');
    const { runRateLimitTests } = await import('./rate-limit.test');

    // Run all tests
    const webhookTests = await runWebhookSecurityTests();
    const csrfTests = await runCsrfTests();
    const rateLimitTests = await runRateLimitTests();

    // Summary
    console.log('='.repeat(70));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Stripe Webhook Tests:  ${webhookTests ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`CSRF Protection Tests: ${csrfTests ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Rate Limiting Tests:   ${rateLimitTests ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(70));

    const allPassed = webhookTests && csrfTests && rateLimitTests;
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED - SECURITY FIXES VERIFIED!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - CHECK ABOVE FOR DETAILS\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ TEST RUNNER ERROR:', error);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
