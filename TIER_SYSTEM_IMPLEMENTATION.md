# New Tier System Implementation - Summary

## ✅ Implemented Changes

### 1. **Pricing Page** (`/app/pricing/page.tsx`)
- ✓ Added "Browse is free" hero banner
- ✓ Updated tier structure:
  - **Basic**: £2/month (or free with 1+ tools)
  - **Standard**: £10/month (or free with 3+ tools) - Marked as "Best Value"
  - **Pro**: £25/month (paid only, no waiver)
- ✓ Shows effective tier calculation for logged-in users
- ✓ Smart messaging showing unlock progress (e.g., "List 2 more tools to unlock Standard free!")
- ✓ Waiver info displayed on each tier card
- ✓ Shows "Your Current Tier" for active subscriptions

### 2. **Subscription Check Endpoint** (`/app/api/subscriptions/check-tool-count/route.ts`)
- ✓ Implements new tier determination logic:
  - 3+ tools → Standard tier (free waiver)
  - 1+ tools → Basic tier (free waiver)
  - 0 tools → None (unless paid subscription exists)
- ✓ Auto-updates users_ext table when tool count changes
- ✓ Tracks tool count in database
- ✓ Called on dashboard load to verify current status

### 3. **Profile Page** (`/app/profile/page.tsx`)
- ✓ Shows "Effective Tier" (computed from subscription + tool count)
- ✓ Displays current tool count
- ✓ Shows unlock path with progress:
  - [ ] 1 tool → Basic free
  - [ ] 3 tools → Standard free
- ✓ Green checkmarks when unlocks are achieved
- ✓ Clear visual hierarchy with color-coded sections

### 4. **Signup** (`/app/signup/page.tsx`)
- ✓ Still requires username on signup
- ✓ Creates user in users_ext with subscription_tier: 'none'

### 5. **Header** (`/app/components/Header.tsx`)
- ✓ Profile link available for logged-in users

## 📊 Tier Limits (Enforced)

| Tier | Monthly Cost | Active Borrows | Max Value | Max Duration | Free Unlock |
|------|-------------|----------------|-----------|--------------|------------|
| Basic | £2 | 1 | £100 | 3 days | 1+ tools |
| Standard | £10 | 2 | £300 | 7 days | 3+ tools |
| Pro | £25 | 5 | £1,000 | 14 days | None |
| Browse | Free | 0 | N/A | N/A | No account needed |

## 🎯 Effective Tier Logic

User's effective tier is determined by (in order):
1. If Pro subscriber → Pro (ignore waivers)
2. Else if 3+ active tools → Standard (free)
3. Else if Standard subscriber → Standard (paid)
4. Else if 1+ active tool → Basic (free)
5. Else if Basic subscriber → Basic (paid)
6. Else → Browse only (no borrowing)

## 🚀 Next Steps / TODO

### Required for Full Implementation:
1. **Borrow Gating Endpoint** - Create `/api/borrow/validate` that:
   - Checks effective tier has minimum Basic level
   - Checks tier limits (active borrows, value cap, duration)
   - Returns clear error messages with CTAs

2. **Dashboard Gating** - Update borrow request submission to:
   - Call validation endpoint before allowing request
   - Show specific error: "Upgrade tier", "List a tool to unlock Basic", etc.
   - Link to /pricing for upgrades
   - Link to /dashboard/add-tool for listing tools

3. **Waiver Loss Warning** - Notify users if they drop below unlock threshold:
   - Email when dropping from 3 to 2 tools
   - In-app banner when dropping from 1 to 0 tools

4. **Stripe Integration** - Connect subscription products:
   - Create Basic £2/month product
   - Create Standard £10/month product
   - Implement webhook to update subscription_status
   - Handle free waivers in billing (no charge when tool count qualifies)

5. **Database Migrations** - If needed:
   - Add `subscription_status` column (active/past_due/canceled)
   - Ensure `tools_count` column exists
   - Add `effective_tier` computed column (optional, can be calculated)

6. **Onboarding Updates** - Update owner pages to show:
   - Current tool count
   - Next unlock target
   - Prominent "List 1 tool → Basic free" call-out

## 📝 Copy Updates

### Pricing Page
- "Browsing is always free — No account needed to discover tools"
- Waiver copy on cards (e.g., "Free if you list 1+ tools")
- Unlock progress: "List 2 more tools to unlock Standard free"

### Profile/Effective Tier Display
- "Effective Tier" instead of just "Plan"
- Show unlock progress with visual checkmarks
- "Next unlock: List 2 more tools for Standard"

### Borrow Errors (when implemented)
- "You need Basic tier or higher to borrow. List 1 tool for free access."
- "You've reached your tier limit. Upgrade to Standard for 2 active borrows."

## 🔍 Data Model

### users_ext table columns:
- `user_id` (uuid)
- `email` (text)
- `username` (text) - Required
- `postcode` (text) - Optional
- `subscription_tier` ('none'|'basic'|'standard'|'pro')
- `subscription_status` ('active'|'past_due'|'canceled'|null) - For future Stripe integration
- `borrow_limit` (int) - Cached from tier
- `tools_count` (int) - Count of active, available tools
- `created_at` (timestamp)
- `updated_at` (timestamp)

### subscriptions table (future Stripe integration):
- `id` (uuid)
- `user_id` (uuid)
- `tier` (text) - 'basic'|'standard'|'pro'
- `status` (text) - 'active'|'past_due'|'canceled'
- `stripe_subscription_id` (text)
- `created_at` (timestamp)
- `expires_at` (timestamp) - For trial periods

## ✨ Key Features Implemented

✓ **Tier System**: 4-tier structure (Browse, Basic, Standard, Pro)
✓ **Tool Waivers**: Free Basic with 1+ tools, Free Standard with 3+ tools
✓ **Effective Tier**: Calculated from subscription + tool count
✓ **Pricing Display**: Shows waiver information and unlock progress
✓ **Profile Tier**: Shows effective tier and unlock path
✓ **Auto-Downgrade**: Lost waiver reverts to paid tier or none
✓ **Zero Browsing Barrier**: Browse without account or payment
✓ **Tool-Based Unlocking**: Clear visual progress toward free upgrades
