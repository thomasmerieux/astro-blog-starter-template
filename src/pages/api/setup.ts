import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.runtime?.env?.DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database not available' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const DB = locals.runtime.env.DB;

    // Create the table
    await DB.prepare(`
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
      )
    `).run();

    // Verify table exists
    const tables = await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rsvp';").first();

    return new Response(JSON.stringify({
      success: true,
      message: 'Database setup complete',
      tableExists: !!tables
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Setup error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};