-- Migration: Add required_rsvp_fields column to events table
-- Run this SQL in your Supabase SQL Editor

-- Add the required_rsvp_fields column to events table
-- This column stores JSON data with boolean flags for which RSVP fields are required
ALTER TABLE events
ADD COLUMN IF NOT EXISTS required_rsvp_fields JSONB;

-- Add a comment to document the column
COMMENT ON COLUMN events.required_rsvp_fields IS 'JSON object specifying which RSVP fields are required: {email: boolean, phone: boolean, address: boolean, guests: boolean}';

-- Optional: Add a GIN index for faster JSON queries (useful if you'll query this column frequently)
CREATE INDEX IF NOT EXISTS idx_events_required_rsvp_fields ON events USING GIN (required_rsvp_fields);




