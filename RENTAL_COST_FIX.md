# Rental Cost Issue - Root Cause and Fix

## Problem
Rental costs showing as £350 and £840 for 7-day rentals instead of expected ~£21.

## Root Cause
1. Historical code bug (commit 672cf7c) used `tool_value` (total tool worth) instead of `daily_rate` for rental cost calculation
2. Existing rentals in database were created with this bug
3. The `daily_rate` column may not exist in the Supabase database yet
4. Frontend code was using wrong field name `daily_rental_rate` instead of `daily_rate`

## What Just Fixed
✅ Frontend code now correctly uses `daily_rate` field
✅ Borrow API code uses `daily_rate` (not tool_value)
✅ Validation API uses `daily_rate`
✅ Immediate payment flow implemented
✅ Tool creation API updated to set both fields

## What Still Needs Doing

### 1. **Add daily_rate column to database** (MUST DO)
Run this SQL in Supabase SQL Editor (SQL section):

```sql
-- Add daily_rate column if it doesn't exist
ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2) DEFAULT 3.00;

-- Populate daily_rate for existing tools
UPDATE tools 
SET daily_rate = CASE 
  WHEN tool_value IS NOT NULL AND tool_value > 0 
    THEN ROUND((tool_value::DECIMAL / 30)::NUMERIC(10, 2), 2)
  ELSE 3.00
END
WHERE daily_rate IS NULL OR daily_rate = 0;

-- Verify it worked
SELECT id, name, tool_value, daily_rate FROM tools LIMIT 20;
```

This sets:
- Tools with tool_value → daily_rate = tool_value / 30 (sensible default)
- Tools without tool_value → daily_rate = £3.00

### 2. **Update or delete old rentals with wrong costs**
Old rentals (£350, £840) have incorrect cost calculations. You can either:

Option A: Delete them and create new ones with correct costs
```sql
-- Delete old incorrect rentals
DELETE FROM rental_transactions 
WHERE status = 'pending_payment' 
AND rental_cost > 100;  -- Adjust threshold as needed
```

Option B: Keep them but understand they won't charge correctly

### 3. **Set proper daily_rate values for your tools**
After SQL runs, edit each tool and set appropriate daily_rate:
- Small tools: £1-3/day
- Medium tools: £3-5/day
- Large/expensive tools: £5+/day

### 4. **Test the flow**
1. Create a new rental request (should show correct ~£21 cost for 7 days × £3/day)
2. Complete Stripe payment (test card: 4242 4242 4242 4242)
3. Verify rental shows "active" status on dashboard

## Cost Calculation (Now Fixed)
```
rentalCost = daily_rate × durationDays
platformFee = rentalCost × 0.15
ownerPayout = rentalCost × 0.85
totalCost = rentalCost
```

Example: £3/day for 7 days
- rentalCost = £21
- ownerPayout = £17.85 (85%)
- platformFee = £3.15 (15%)
