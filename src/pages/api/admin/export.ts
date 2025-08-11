import type { APIRoute } from 'astro';

export const prerender = false;

// Helper function to check admin authentication
function isAdminAuthenticated(cookies: any): boolean {
  return cookies.get('admin_session')?.value === 'authenticated';
}

// Export RSVPs as CSV
export const GET: APIRoute = async ({ cookies, locals, url }) => {
  try {
    // Check authentication
    if (!isAdminAuthenticated(cookies)) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!locals.runtime?.env?.DB) {
      return new Response('Database not available', { status: 500 });
    }

    const DB = locals.runtime.env.DB;
    const format = url.searchParams.get('format') || 'csv';

    const result = await DB.prepare(
      `
      SELECT 
        first_name, last_name, email, attending, vegetarian, 
        plus_one, guest_first_name, guest_last_name, plus_one_vegetarian, 
        language, submitted_at
      FROM rsvp 
      ORDER BY submitted_at DESC
    `
    ).all();

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Attending',
        'Vegetarian',
        'Plus One',
        'Guest First Name',
        'Guest Last Name',
        'Guest Vegetarian',
        'Language',
        'Submitted At',
      ];

      const csvRows = [headers.join(',')];

      result.results.forEach((row) => {
        const csvRow = [
          `"${row.first_name}"`,
          `"${row.last_name}"`,
          `"${row.email}"`,
          `"${row.attending}"`,
          row.vegetarian ? 'Yes' : 'No',
          row.plus_one ? 'Yes' : 'No',
          `"${row.guest_first_name || ''}"`,
          `"${row.guest_last_name || ''}"`,
          row.plus_one_vegetarian ? 'Yes' : 'No',
          `"${row.language}"`,
          `"${new Date(row.submitted_at).toLocaleString()}"`,
        ];
        csvRows.push(csvRow.join(','));
      });

      const csv = csvRows.join('\n');

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wedding-rsvps-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // JSON export
      return new Response(JSON.stringify(result.results, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="wedding-rsvps-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting RSVPs:', error);
    return new Response('Export failed', { status: 500 });
  }
};
