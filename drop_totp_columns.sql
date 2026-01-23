-- Drop TOTP-related columns from admin_users table
-- Run this in your Supabase SQL editor

ALTER TABLE admin_users
DROP COLUMN IF EXISTS totp_enabled,
DROP COLUMN IF EXISTS totp_secret;

-- Also drop the password_reset_tokens table if it has TOTP-related columns
-- Check if the table exists and has requires_totp column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'password_reset_tokens'
        AND column_name = 'requires_totp'
    ) THEN
        ALTER TABLE password_reset_tokens
        DROP COLUMN IF EXISTS requires_totp;
    END IF;
END $$;