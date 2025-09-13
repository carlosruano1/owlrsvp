-- OwlRSVP Database Schema
-- Run this in your Supabase SQL editor

-- Events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  allow_plus_guests BOOLEAN DEFAULT false,
  background_color TEXT DEFAULT '#1f2937',
  admin_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendees table
CREATE TABLE attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  guest_count INTEGER DEFAULT 0,
  attending BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_events_admin_token ON events(admin_token);
CREATE INDEX idx_attendees_event_id ON attendees(event_id);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Events: Allow public read, no write restrictions (handled by app logic)
CREATE POLICY "Allow public read access to events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to events" ON events
  FOR INSERT WITH CHECK (true);

-- Attendees: Allow public read/write for event attendees
CREATE POLICY "Allow public read access to attendees" ON attendees
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to attendees" ON attendees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to attendees" ON attendees
  FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
