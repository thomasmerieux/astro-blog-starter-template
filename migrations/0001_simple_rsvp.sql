-- Simple RSVP table without Drizzle
CREATE TABLE IF NOT EXISTS rsvp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    attending TEXT NOT NULL,
    vegetarian INTEGER DEFAULT 0,
    plus_one INTEGER DEFAULT 0,
    plus_one_name TEXT,
    message TEXT,
    language TEXT DEFAULT 'en',
    submitted_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);