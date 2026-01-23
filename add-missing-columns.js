/**
 * This script guides you through adding missing columns to users_ext table
 * 
 * The phone_number column is required for the signup flow to work.
 * 
 * Solution: Add this column manually via Supabase SQL Editor
 */

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              ADD MISSING COLUMNS TO users_ext TABLE                ║
╚════════════════════════════════════════════════════════════════════╝

Your signup is failing because the users_ext table is missing the 
'phone_number' column. Here's how to fix it:

STEP 1: Go to your Supabase Dashboard
  → Open your ToolShare project
  → Click "SQL Editor" in the left sidebar

STEP 2: Create a new query
  → Click "New Query"
  → Paste the SQL commands below
  → Click "Run"

STEP 3: SQL Commands to Run
═════════════════════════════════════════════════════════════════════

ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE;

ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE;

═════════════════════════════════════════════════════════════════════

STEP 4: Verify Success
After running the SQL, you should see these messages:
  ✓ "ALTER TABLE 1" for each ALTER statement

STEP 5: Try Signing Up Again
Once the columns are added, reload this page and try signing up again.

Questions?
  • Check the Supabase docs: https://supabase.com/docs/guides/database
  • View your table structure: SQL Editor → SELECT * FROM users_ext LIMIT 1
`);

