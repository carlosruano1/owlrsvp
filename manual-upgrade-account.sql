-- Manual Account Upgrade for Testing
-- Run this in Supabase SQL Editor

-- Step 1: Find your user ID (replace 'your_username' or 'your_email' with your actual username/email)
-- Uncomment and run this first to find your user ID:
-- SELECT id, username, email, subscription_tier, subscription_status 
-- FROM admin_users 
-- WHERE username = 'your_username' OR email = 'your_email';

-- Step 2: Update your subscription tier (replace 'YOUR_USER_ID' with the ID from Step 1)
-- Choose one of the tiers: 'free', 'basic', 'pro', 'enterprise'

-- Upgrade to BASIC ($9/mo)
UPDATE admin_users
SET 
  subscription_tier = 'basic',
  subscription_status = 'active',
  max_events = 5,
  max_attendees_per_event = 200
WHERE id = 'YOUR_USER_ID';

-- OR Upgrade to PRO ($29/mo)
-- UPDATE admin_users
-- SET 
--   subscription_tier = 'pro',
--   subscription_status = 'active',
--   max_events = 25,
--   max_attendees_per_event = 1000
-- WHERE id = 'YOUR_USER_ID';

-- OR Upgrade to ENTERPRISE ($99/mo)
-- UPDATE admin_users
-- SET 
--   subscription_tier = 'enterprise',
--   subscription_status = 'active',
--   max_events = 999999,
--   max_attendees_per_event = 5000
-- WHERE id = 'YOUR_USER_ID';

-- Step 3: Verify the update
-- SELECT id, username, email, subscription_tier, subscription_status, max_events, max_attendees_per_event
-- FROM admin_users
-- WHERE id = 'YOUR_USER_ID';


