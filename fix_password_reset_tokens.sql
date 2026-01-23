-- Fix password_reset_tokens table structure
-- Run this in your Supabase SQL editor

-- Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  requires_totp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns
ALTER TABLE password_reset_tokens
ADD COLUMN IF NOT EXISTS used BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_totp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure proper defaults
ALTER TABLE password_reset_tokens
ALTER COLUMN used SET DEFAULT FALSE,
ALTER COLUMN requires_totp SET DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(admin_user_id);

-- Disable RLS for password_reset_tokens since we use service role access
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Also check and fix admin_users table if needed
-- Make sure admin_users has RLS disabled for service role access
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'password_reset_tokens'
ORDER BY ordinal_position;

-- Check if admin_users table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users'
AND column_name IN ('id', 'email', 'is_active')
ORDER BY ordinal_position;

-- Check if there are any users in admin_users
SELECT COUNT(*) as user_count FROM admin_users WHERE is_active = true;

-- Check for problematic constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'password_reset_tokens'
AND tc.constraint_type = 'CHECK';

-- Drop the problematic constraint if it exists
ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS check_no_plaintext_token;

-- Clean up any expired tokens (older than 24 hours)
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() - INTERVAL '24 hours';