-- Migration: Add stripe_customer_id column to admin_users table
-- Run this SQL in your Supabase SQL Editor

-- Add the stripe_customer_id column to admin_users table
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN admin_users.stripe_customer_id IS 'Stripe customer ID for subscription management';

-- Optional: Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_stripe_customer_id ON admin_users(stripe_customer_id);

