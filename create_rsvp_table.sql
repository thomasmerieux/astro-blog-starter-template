-- RSVP Table Creation Script
-- Wedding RSVP system database table

CREATE TABLE IF NOT EXISTS rsvp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    attending TEXT NOT NULL CHECK (attending IN ('yes', 'no')),
    vegetarian INTEGER DEFAULT 0 CHECK (vegetarian IN (0, 1)),
    plus_one INTEGER DEFAULT 0 CHECK (plus_one IN (0, 1)),
    guest_first_name TEXT,
    guest_last_name TEXT,
    plus_one_vegetarian INTEGER DEFAULT 0 CHECK (plus_one_vegetarian IN (0, 1)),
    plus_one_name TEXT,
    message TEXT,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ro')),
    submitted_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rsvp_email ON rsvp(email);
CREATE INDEX IF NOT EXISTS idx_rsvp_submitted_at ON rsvp(submitted_at);
CREATE INDEX IF NOT EXISTS idx_rsvp_attending ON rsvp(attending);
CREATE INDEX IF NOT EXISTS idx_rsvp_language ON rsvp(language);