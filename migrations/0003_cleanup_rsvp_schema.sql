-- Add missing columns and clean up RSVP schema
-- This migration adds guest_last_name and plus_one_vegetarian if they don't exist

-- Add guest_last_name if it doesn't exist
ALTER TABLE rsvp ADD COLUMN guest_last_name TEXT;

-- Add plus_one_vegetarian if it doesn't exist  
ALTER TABLE rsvp ADD COLUMN plus_one_vegetarian INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rsvp_email ON rsvp(email);
CREATE INDEX IF NOT EXISTS idx_rsvp_submitted_at ON rsvp(submitted_at);
CREATE INDEX IF NOT EXISTS idx_rsvp_attending ON rsvp(attending);