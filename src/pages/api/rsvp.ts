import type { APIRoute } from 'astro';
export const prerender = false;

// Simple email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    // Check if we have database access
    if (!locals.runtime?.env?.DB) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database connection not available'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const DB = locals.runtime.env.DB;
    const formData = await request.formData();

    // Extract form data
    const firstName = formData.get('firstName')?.toString().trim();
    const lastName = formData.get('lastName')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const attending = formData.get('attendance')?.toString();
    const vegetarian = formData.get('vegetarian') === 'on' ? 1 : 0;
    const plusOne = formData.get('plusOne') === 'on' ? 1 : 0;
    const plusOneName = plusOne ? 
      `${formData.get('plusOneFirstName')?.toString().trim()} ${formData.get('plusOneLastName')?.toString().trim()}`.trim() 
      : null;
    const message = formData.get('message')?.toString().trim() || null;
    const language = formData.get('language')?.toString() || 'en';

    // Validation
    const errors: string[] = [];
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Please enter a valid email address');
    if (!attending || !['yes', 'no'].includes(attending)) errors.push('Please select your attendance');
    if (plusOne && !plusOneName) errors.push('Plus one name is required');

    console.log('hello')
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get additional metadata
    const userAgent = request.headers.get('user-agent') || null;
    const submittedAt = Date.now();

    // Insert into database using direct D1 query
    const result = await DB.prepare(`
      INSERT INTO rsvp (
        first_name, last_name, email, attending, vegetarian, 
        plus_one, plus_one_name, message, language, submitted_at, 
        ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      firstName,
      lastName, 
      email,
      attending,
      vegetarian,
      plusOne,
      plusOneName,
      message,
      language,
      submittedAt,
      clientAddress,
      userAgent
    ).run();

    if (!result.success) {
      throw new Error('Failed to insert RSVP');
    }

    console.log('RSVP submitted successfully:', result.meta.last_row_id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'RSVP submitted successfully!',
      id: result.meta.last_row_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('RSVP submission error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to submit RSVP. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Get all RSVPs (for testing)
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

    const result = await locals.runtime.env.DB.prepare(`
      SELECT id, first_name, last_name, email, attending, vegetarian, 
             plus_one, plus_one_name, message, language, submitted_at
      FROM rsvp 
      ORDER BY submitted_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      rsvps: result.results.map(row => ({
        ...row,
        submitted_at: new Date(row.submitted_at).toISOString()
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to fetch RSVPs' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};