-- Update RSVP table to add guest_last_name and plus_one_vegetarian fields
-- Remove unused plus_one_name and message columns

-- Add new columns
ALTER TABLE rsvp ADD COLUMN guest_last_name TEXT;
ALTER TABLE rsvp ADD COLUMN plus_one_vegetarian INTEGER DEFAULT 0;

-- Note: SQLite doesn't support DROP COLUMN directly, but we can ignore the unused columns
-- plus_one_name and message will remain in the table but won't be used by the application