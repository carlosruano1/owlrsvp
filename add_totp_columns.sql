-- Add TOTP-related columns back to admin_users table
-- Run this in your Supabase SQL editor

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- Also add requires_totp column to password_reset_tokens if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'password_reset_tokens'
        AND column_name = 'requires_totp'
    ) THEN
        ALTER TABLE password_reset_tokens
        ADD COLUMN requires_totp BOOLEAN DEFAULT FALSE;
    END IF;
END $$;