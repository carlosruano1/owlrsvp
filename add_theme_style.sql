-- =============================================================================
-- Theme style for event invites (glass, electric, drawing, elegant)
-- =============================================================================
--
-- WHAT TO DO IN SUPABASE:
-- 1. Open your project at https://supabase.com/dashboard
-- 2. Go to SQL Editor
-- 3. New query → paste this entire file → Run
--
-- This adds a single column so event creators can choose an invite "effect"
-- (default, glass, electric, drawing, elegant) in Event settings → Appearance.
-- =============================================================================

ALTER TABLE events
ADD COLUMN IF NOT EXISTS theme_style text DEFAULT 'default';

COMMENT ON COLUMN events.theme_style IS 'Invite visual style: default, glass, electric, drawing, elegant';
