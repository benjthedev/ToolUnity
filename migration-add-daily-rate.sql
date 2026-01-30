/*
Migration: Add daily_rate column to tools and set default values

This migration adds a daily_rate column to the tools table and populates it
based on existing tool_value columns. The daily_rate represents the rental
price per day, while tool_value represents the total value of the tool.
*/

-- 1. Add daily_rate column to tools table if it doesn't exist
ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2);

-- 2. Set default daily_rate for tools that don't have one
-- Strategy: 
--   - If tool_value exists and is > 0, default to tool_value / 30 (30-day valuation)
--   - Otherwise, default to 3.00 (£3/day)
UPDATE tools 
SET daily_rate = CASE 
  WHEN tool_value IS NOT NULL AND tool_value > 0 
    THEN ROUND((tool_value::DECIMAL / 30)::NUMERIC(10, 2), 2)
  ELSE 3.00
END
WHERE daily_rate IS NULL OR daily_rate = 0;

-- 3. Set a sensible default constraint
ALTER TABLE tools 
ALTER COLUMN daily_rate SET DEFAULT 3.00;

-- 4. Verify the migration worked
SELECT id, name, tool_value, daily_rate 
FROM tools 
ORDER BY created_at DESC 
LIMIT 20;
