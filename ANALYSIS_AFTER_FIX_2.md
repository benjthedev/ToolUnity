# ToolShare Code Analysis - After Email Verification Fix

**Date**: January 23, 2026  
**Previous Session**: Fixed 10 critical issues + 3 schema consistency issues  
**Current Status**: ✅ Server running successfully with no compilation errors

---

## ✅ FIXES VERIFIED (Just Applied)

### Fix #1: Remove borrow_limit from validation endpoint ✅
- **File**: [app/api/borrow/validate/route.ts](app/api/borrow/validate/route.ts#L45)
- **Change**: `.select('subscription_tier, tools_count, borrow_limit')` → `.select('subscription_tier, tools_count')`
- **Status**: ✅ VERIFIED - Field no longer in select statement

### Fix #2: Enforce email verification before borrowing ✅
- **File**: [app/api/borrow/route.ts](app/api/borrow/route.ts#L52)
- **Change**: Added email verification check after profile fetch
- **Status**: ✅ VERIFIED - Returns 403 if email not verified

### Fix #3: Remove borrow_limit from test script ✅
- **File**: [create-test-user.js](create-test-user.js#L72)
- **Change**: Removed `borrow_limit: 2`, added `tools_count: 0, email_verified: true`
- **Status**: ✅ VERIFIED - Test script now matches schema

---

## 🔴 CRITICAL ISSUES IDENTIFIED (13 Remaining)

### Issue #4: Type Safety (3+ `any` types) 🟠 MEDIUM PRIORITY
- **Where**: [app/api/verify-email/route.ts](app/api/verify-email/route.ts#L18), line 18, 19, 68
- **Problem**: `let users: any;` `let selectError: any;` `let updateError: any = null;`
- **Risk**: Silent failures, missing null checks, type errors at runtime
- **Fix**: Change to proper types:
  ```typescript
  let users: { user_id: string; email_verified?: boolean; email_verification_sent_at?: string } | null = null;
  let selectError: PostgrestError | null = null;
  let updateError: PostgrestError | null = null;
  ```
- **Effort**: 30 minutes

### Issue #5: Stripe Webhook - No Signature Verification in Production ⚠️ CRITICAL
- **Where**: [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts#L19)
- **Problem**: Line 19-24 skips verification if `NODE_ENV === 'development'` - RISKY in production if env var wrong
- **Risk**: Malicious actor could forge webhook events, manipulate billing
- **Current Code**:
  ```typescript
  if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_WEBHOOK_SECRET) {
    // SKIPS verification
  }
  ```
- **Fix**: Must require webhook secret in production:
  ```typescript
  if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_WEBHOOK_SECRET) {
    // Only skip in dev AND no secret set
  } else if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }
  ```
- **Effort**: 45 minutes

### Issue #6: Missing N+1 Query Problem (tools page) 🟠 MEDIUM PRIORITY
- **Where**: [app/tools/page.tsx](app/tools/page.tsx) (suspected)
- **Problem**: Tool list page likely fetches tools, then for each tool fetches owner details individually
- **Impact**: 1 query for list + N queries for owners = O(N) database calls instead of 1 JOIN
- **Fix**: Use joins in Supabase query to fetch owner data with tools in single query
- **Effort**: 1-2 hours

### Issue #7: No CSRF Protection ⚠️ CRITICAL
- **Impact**: State-changing operations (create borrow, add tool, etc.) vulnerable to CSRF
- **Where**: All POST/DELETE endpoints in app/api/*
- **Fix**: Add CSRF token generation and validation middleware
- **Effort**: 2-3 hours

### Issue #8: Rate Limiting Missing ⚠️ CRITICAL  
- **Impact**: No protection against brute force (password guessing), DDoS, spam
- **Where**: All API routes, especially auth, verification email, borrow
- **Fix**: Implement rate limiting middleware (IP-based or user-based)
- **Effort**: 2-3 hours

### Issue #9: Password Reset Not Implemented ⚠️ CRITICAL
- **Impact**: Users can't recover lost password
- **Where**: Missing [app/api/auth/reset-password/route.ts](app/api/auth/reset-password/route.ts)
- **Fix**: Email-based password reset with time-limited tokens
- **Effort**: 3-4 hours

### Issue #10: No Input Validation Library 🟠 MEDIUM PRIORITY
- **Problem**: Manual validation scattered across endpoints (duplicate logic)
- **Where**: signup, add-tool, borrow, etc. all do custom validation
- **Fix**: Use Zod or Joi for schema validation
- **Effort**: 2-3 hours

### Issue #11: Logging - Console.logs in Production 🟠 MEDIUM PRIORITY
- **Problem**: 20+ console.log/console.error calls will spam production logs
- **Where**: [app/api/check-subscription/route.ts](app/api/check-subscription/route.ts#L55), [sync-subscription/route.ts](app/api/sync-subscription/route.ts#L47), webhooks, etc.
- **Fix**: Implement proper logging with levels (dev vs prod):
  ```typescript
  const log = (level: 'error'|'warn'|'info'|'debug', msg: string) => {
    if (process.env.NODE_ENV === 'production' && level === 'debug') return;
    console[level](msg);
  };
  ```
- **Effort**: 1 hour

### Issue #12: Email Verification Token - No Expiration Check in verify-email ⚠️ HIGH PRIORITY
- **Where**: [app/api/verify-email/route.ts](app/api/verify-email/route.ts#L47)
- **Problem**: Line 47-54 checks expiration but only if `email_verification_sent_at` exists - if missing, no validation
- **Risk**: If column missing, token never expires
- **Fix**: Require the column or fail safe:
  ```typescript
  if (!users.email_verification_sent_at) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
  }
  ```
- **Effort**: 15 minutes

### Issue #13: Hardcoded Stripe Price IDs (3 locations) 🟠 MEDIUM PRIORITY
- **Where**: [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts#L59-65), [check-subscription/route.ts](app/api/check-subscription/route.ts) (likely), [sync-subscription/route.ts](app/api/sync-subscription/route.ts) (likely)
- **Problem**: Changing prices requires code updates - should be in env vars or database
- **Fix**: Move to `.env.local`:
  ```
  STRIPE_PRICE_BASIC=price_1SmI9kBt1LczyCVDZeEMqvMJ
  STRIPE_PRICE_STANDARD=price_1Sk7XZBt1LczyCVDOPofihFZ
  STRIPE_PRICE_PRO=price_1Sk7YbBt1LczyCVDef9jBhUV
  ```
- **Effort**: 1 hour

### Issue #14: No Pagination on Borrow/Owner Requests ⚠️ MEDIUM PRIORITY
- **Where**: [app/api/user/requests/route.ts](app/api/user/requests/route.ts), [app/api/owner/requests/route.ts](app/api/owner/requests/route.ts)
- **Problem**: Fetches all requests without limit - could load thousands of records
- **Fix**: Add pagination with limit/offset
- **Effort**: 1-2 hours

### Issue #15: No XSS Protection on Tool Descriptions 🟠 MEDIUM PRIORITY
- **Where**: Tool add form, tool display pages
- **Problem**: User-submitted tool descriptions stored in DB and displayed - no sanitization
- **Risk**: XSS attacks via malicious tool descriptions
- **Fix**: Use DOMPurify on frontend + sanitize on backend (node-html-parser)
- **Effort**: 1-2 hours

### Issue #16: Session Timeout Not Configured ⚠️ HIGH PRIORITY
- **Where**: [auth.ts](auth.ts#L32)
- **Problem**: No `maxAge` set on JWT session - token could be valid indefinitely
- **Fix**: Add session config:
  ```typescript
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  ```
- **Effort**: 15 minutes

---

## 📊 ISSUE PRIORITY MATRIX

| Priority | Count | Issues | Time to Fix |
|----------|-------|--------|------------|
| 🔴 CRITICAL | 3 | Stripe webhooks, CSRF, Rate limiting | 8-10 hrs |
| ⚠️ HIGH | 2 | Password reset, Session timeout | 3-4 hrs |
| 🟠 MEDIUM | 8 | Type safety, N+1 queries, logging, etc. | 8-10 hrs |

**Total Estimated Time**: 19-24 hours of work

---

## 🎯 RECOMMENDED FIX ORDER (By Risk)

1. **Session timeout** (15 min) - Quick security win
2. **Stripe webhook verification** (45 min) - Prevents fraud
3. **Email verification token expiration** (15 min) - Quick security fix
4. **Type safety (verify-email)** (30 min) - Prevents bugs
5. **CSRF protection** (2-3 hrs) - Essential for production
6. **Rate limiting** (2-3 hrs) - Prevent abuse
7. **Password reset** (3-4 hrs) - User-facing feature
8. **Logging cleanup** (1 hr) - Operations improvement
9. **Stripe price IDs** (1 hr) - Maintainability
10. **N+1 queries** (1-2 hrs) - Performance
11. **Input validation** (2-3 hrs) - Code quality
12. **Pagination** (1-2 hrs) - Scalability
13. **XSS protection** (1-2 hrs) - Security

---

## 📋 NOTES

- **Schema**: All database migrations complete (phone_number, email_verified, etc.)
- **Email verification**: Now enforced in borrow endpoint ✅
- **Tier system**: Working correctly with free tier unlocks
- **Compilation**: Zero errors, server running normally
- **Previous fixes**: 10 security/validation fixes from session 1 still in place

---

## 🚀 NEXT SESSION: Start with Issue #16 (Session timeout)
Most bang for buck - 15 minutes for significant security improvement.
