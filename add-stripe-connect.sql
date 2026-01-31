-- Add Stripe Connect account ID to users table
-- This stores the owner's Stripe Connect account for receiving payouts

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- Add transfer ID to rental_transactions to track payouts
-- This records the Stripe transfer ID when funds are sent to owner

ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS transfer_id TEXT;

-- Add index for faster Connect account lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect 
ON users(stripe_connect_account_id) 
WHERE stripe_connect_account_id IS NOT NULL;

-- Add index for transfer tracking
CREATE INDEX IF NOT EXISTS idx_rental_transactions_transfer 
ON rental_transactions(transfer_id) 
WHERE transfer_id IS NOT NULL;
