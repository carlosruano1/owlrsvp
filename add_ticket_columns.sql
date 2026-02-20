-- Add ticket columns to attendees table for QR-based check-in
ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS ticket_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES admin_users(id);

COMMENT ON COLUMN attendees.ticket_code IS 'Unique code for QR ticket scanning and check-in';
COMMENT ON COLUMN attendees.checked_in_at IS 'Timestamp when attendee was checked in at the event';
COMMENT ON COLUMN attendees.checked_in_by IS 'Admin user who performed the check-in (nullable)';