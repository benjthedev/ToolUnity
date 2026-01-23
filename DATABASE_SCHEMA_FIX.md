# Database Schema Fix - Missing Columns

## Problem

Signup is failing with error:
```
Failed to create user profile: Could not find the 'phone_number' column of 'users_ext' in the schema cache
```

## Cause

The `users_ext` table is missing required columns that were added to the application code.

## Solution

Run this SQL in your Supabase SQL Editor:

1. Go to https://supabase.com → Your Project → SQL Editor
2. Click "New Query"
3. Copy and paste this SQL:

```sql
-- Add phone_number column
ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add email verification columns
ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE;

ALTER TABLE users_ext 
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE;
```

4. Click "Run"
5. You should see success messages like "ALTER TABLE 1"
6. Try signing up again - it should work!

## What These Columns Do

- **phone_number**: Stores user's phone number for borrowing coordination
- **email_verified**: Tracks whether email has been verified (true/false)
- **email_verification_token**: Random token sent in verification email
- **email_verification_sent_at**: Timestamp of when verification email was sent

## Still Having Issues?

1. Check that you're in the right Supabase project
2. Verify the `users_ext` table exists (view in Table Editor)
3. Make sure you have admin/owner permissions
4. Clear browser cache and try again after SQL runs

## For Future Development

All new database schema changes should be:
1. Documented in migration files
2. Tested locally first
3. Applied to all environments (dev, staging, production)
