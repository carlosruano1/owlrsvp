-- Add missing Stripe subscription columns to admin_users table
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE;

-- Create an index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_stripe_customer_id ON admin_users(stripe_customer_id);

-- Create an index on stripe_subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_stripe_subscription_id ON admin_users(stripe_subscription_id);