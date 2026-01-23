-- Add owner_subscription_tier column to team_members table
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS owner_subscription_tier VARCHAR(50) DEFAULT 'free';

-- Update existing records to have the correct admin tier
UPDATE team_members
SET owner_subscription_tier = admin_users.subscription_tier
FROM admin_users
WHERE team_members.owner_id = admin_users.id
AND (team_members.owner_subscription_tier IS NULL OR team_members.owner_subscription_tier = 'free');