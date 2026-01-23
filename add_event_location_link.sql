-- Add event_location_link column to events table
-- This allows users to specify a custom map link separate from the display location

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_location_link TEXT;

-- Add comment for documentation
COMMENT ON COLUMN events.event_location_link IS 'Optional custom map URL/link. If provided, this will be used for map navigation instead of the display location name.';