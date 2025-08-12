import type { APIRoute } from 'astro';
import type { AstroCookies, CloudflareD1Database, RSVPRow, RSVPStats } from '../../../types/api';

export const prerender = false;

// Helper function to check admin authentication
function isAdminAuthenticated(cookies: AstroCookies): boolean {
  return cookies.get('admin_session')?.value === 'authenticated';
}

// Get all RSVPs for admin
export const GET: APIRoute = async ({ cookies, locals, url }) => {
  try {
    // Check authentication
    if (!isAdminAuthenticated(cookies)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!locals.runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const DB = locals.runtime.env.DB as CloudflareD1Database;

    // Get query parameters for filtering
    const attending = url.searchParams.get('attending');
    const language = url.searchParams.get('language');
    const vegetarian = url.searchParams.get('vegetarian');

    // Build query with filters
    let query = `
      SELECT 
        id, first_name, last_name, email, attending, vegetarian, 
        plus_one, guest_first_name, guest_last_name, plus_one_vegetarian, 
        language, submitted_at, ip_address
      FROM rsvp 
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (attending && attending !== 'all') {
      query += ' AND attending = ?';
      params.push(attending);
    }

    if (language && language !== 'all') {
      query += ' AND language = ?';
      params.push(language);
    }

    if (vegetarian === 'true') {
      query += ' AND (vegetarian = 1 OR plus_one_vegetarian = 1)';
    }

    query += ' ORDER BY submitted_at DESC';

    const result = await DB.prepare(query)
      .bind(...params)
      .all<RSVPRow>();

    // Calculate statistics
    const stats: RSVPStats = {
      total: result.results.length,
      attending: result.results.filter((r) => r.attending === 'yes').length,
      notAttending: result.results.filter((r) => r.attending === 'no').length,
      plusOnes: result.results.filter((r) => r.plus_one === 1).length,
      vegetarians: result.results.filter((r) => r.vegetarian === 1 || r.plus_one_vegetarian === 1)
        .length,
      languages: {
        en: result.results.filter((r) => r.language === 'en').length,
        fr: result.results.filter((r) => r.language === 'fr').length,
        ro: result.results.filter((r) => r.language === 'ro').length,
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        rsvps: result.results.map((row) => ({
          ...row,
          submitted_at: new Date(row.submitted_at).toISOString(),
        })),
        stats,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch RSVPs',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
