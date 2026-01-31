-- Add columns to rental_transactions table for owner approval workflow

-- Add approved_at timestamp
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add rejected_at timestamp  
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Add rejection_reason text field
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add refund_id for Stripe refund tracking
ALTER TABLE rental_transactions
ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255);

-- Add index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_rental_transactions_status ON rental_transactions(status);

-- Add index on owner_id for owner dashboard queries
CREATE INDEX IF NOT EXISTS idx_rental_transactions_owner_id ON rental_transactions(owner_id);

-- Update any existing 'active' rentals to 'pending_approval' if they don't have approved_at set
-- This handles edge case where payment completed but owner hasn't approved yet
-- Comment this out if you want to keep existing active rentals as-is
-- UPDATE rental_transactions 
-- SET status = 'pending_approval'
-- WHERE status = 'active' AND approved_at IS NULL;
