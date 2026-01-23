/**
 * Migration: Add Tool Count Incentive Fields to Subscriptions Table
 * 
 * This adds support for the Free Standard Plan for Tool Owners feature.
 * 
 * Run this in Supabase SQL Editor:
 */

const migrationSQL = `
-- Add fields to track tool count grant
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS is_free_tool_owner_grant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS granted_tool_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS previous_plan TEXT DEFAULT NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_tool_owner_grant 
ON subscriptions(user_id) 
WHERE is_free_tool_owner_grant = TRUE;
`;

console.log('SQL Migration for Tool Count Incentive:');
console.log('========================================\n');
console.log(migrationSQL);
console.log('\n✓ Copy the SQL above and run it in your Supabase SQL Editor');
console.log('\nFields added:');
console.log('  - is_free_tool_owner_grant: BOOLEAN - Indicates if Standard plan was granted due to 3+ tools');
console.log('  - granted_tool_count: INTEGER - Number of tools that qualified them for the grant');
console.log('  - previous_plan: TEXT - The plan they had before the grant (for reverting)');
