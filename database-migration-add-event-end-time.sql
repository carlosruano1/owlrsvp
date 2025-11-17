-- Migration: Add event_end_time column to events table
-- Run this SQL in your Supabase SQL Editor

-- Add the event_end_time column to events table
-- This column stores the end date and time of the event (stored as TEXT in datetime-local format: YYYY-MM-DDTHH:MM)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_end_time TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN events.event_end_time IS 'Event end date and time in datetime-local format (YYYY-MM-DDTHH:MM). Optional field for all tiers.';

-- Optional: If you prefer using TIMESTAMP instead of TEXT, use this instead:
-- ALTER TABLE events
-- ADD COLUMN IF NOT EXISTS event_end_time TIMESTAMP WITH TIME ZONE;
-- COMMENT ON COLUMN events.event_end_time IS 'Event end date and time. Optional field for all tiers.';

