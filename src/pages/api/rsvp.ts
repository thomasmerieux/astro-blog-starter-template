import type { APIRoute } from 'astro';
import { EmailService } from '../../utils/emailService';
import type { RSVPData } from '../../utils/emailTemplates';
export const prerender = false;

// Comprehensive email validation
function validateEmail(email: string): boolean {
  // Basic format check
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional security checks
  if (email.length > 254) return false; // RFC 5321 limit
  if (email.includes('..')) return false; // Double dots not allowed
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (email.includes('@.') || email.includes('.@')) return false;

  // Check for common disposable email patterns
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return false;
  }

  return true;
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"']/g, '') // Remove potential XSS characters
    .substring(0, 100); // Limit length
}

// Simple rate limiting check
async function checkRateLimit(DB: any, email: string, ipAddress: string): Promise<boolean> {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // Check submissions from this email in the last hour
  const emailCount = await DB.prepare(
    'SELECT COUNT(*) as count FROM rsvp WHERE email = ? AND submitted_at > ?'
  )
    .bind(email, oneHourAgo)
    .first();

  if (emailCount.count >= 3) return false;

  // Check submissions from this IP in the last hour
  const ipCount = await DB.prepare(
    'SELECT COUNT(*) as count FROM rsvp WHERE ip_address = ? AND submitted_at > ?'
  )
    .bind(ipAddress, oneHourAgo)
    .first();

  if (ipCount.count >= 5) return false;

  return true;
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    // Check if we have database access in production mode
    if (!locals.runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database connection not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const DB = locals.runtime.env.DB;
    const formData = await request.formData();

    // Extract and sanitize form data
    const firstName = sanitizeInput(formData.get('firstName')?.toString() || '');
    const lastName = sanitizeInput(formData.get('lastName')?.toString() || '');
    const email = formData.get('email')?.toString()?.trim().toLowerCase() || '';
    const attending = formData.get('attendance')?.toString();
    const vegetarian = formData.get('vegetarian') === 'on' ? 1 : 0;
    const plusOne = formData.get('plusOne') === 'on' ? 1 : 0;
    const guestFirstName = formData.get('guestFirstName')?.toString()
      ? sanitizeInput(formData.get('guestFirstName')?.toString() || '')
      : null;
    const guestLastName = formData.get('guestLastName')?.toString()
      ? sanitizeInput(formData.get('guestLastName')?.toString() || '')
      : null;
    const plusOneVegetarian = formData.get('plusOneVegetarian') === 'on' ? 1 : 0;
    const language = formData.get('language')?.toString() || 'en';

    // Rate limiting check
    if (!(await checkRateLimit(DB, email, clientAddress))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many submissions. Please try again later.',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validation
    const errors: string[] = [];
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Please enter a valid email address');
    if (!attending || !['yes', 'no'].includes(attending))
      errors.push('Please select your attendance');
    if (plusOne && (!guestFirstName || !guestLastName)) errors.push('Guest name is required');

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get additional metadata
    const userAgent = request.headers.get('user-agent') || null;
    const submittedAt = Date.now();

    // Insert into database using direct D1 query
    const result = await DB.prepare(
      `
      INSERT INTO rsvp (
        first_name, last_name, email, attending, vegetarian, 
        plus_one, guest_first_name, guest_last_name, plus_one_vegetarian, 
        language, submitted_at, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        firstName,
        lastName,
        email,
        attending,
        vegetarian,
        plusOne,
        guestFirstName,
        guestLastName,
        plusOneVegetarian,
        language,
        submittedAt,
        clientAddress,
        userAgent
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to insert RSVP');
    }

    // Send emails using professional email service
    try {
      // Check if we have the required API keys
      const apiKey =
        locals.runtime?.env?.API_KEY_RESEND || locals.runtime?.env?.RESEND_WEDDING_API_KEY;

      if (!apiKey) {
        console.warn('⚠️ Resend API key not available - skipping email notifications');
      } else {
        // Initialize email service
        const emailService = new EmailService({
          apiKey: apiKey as string,
          from: 'Dana & Thomas <wedding@danaandthomas.party>',
          adminEmail: ["thomas.merieux@gmail.com", "dna_shikhil@yahoo.se"],
        });

        // Prepare RSVP data for email templates
        const rsvpEmailData: RSVPData = {
          firstName,
          lastName,
          email,
          attending,
          vegetarian,
          plusOne,
          guestFirstName,
          guestLastName,
          plusOneVegetarian,
          language,
          weddingDate: 'September 20, 2025',
          venueName: 'Loft Diplomat',
          venueAddress: 'Herăstrău Park, Bucharest, Romania',
          coupleNames: 'Dana & Thomas',
        };

        // Send both guest confirmation and admin notification
        const emailResults = await emailService.sendRSVPEmails(rsvpEmailData);

        // Log results but don't fail RSVP if emails fail
        if (emailResults.guestEmail.success) {
          console.warn(`✅ Guest confirmation sent to ${email}`);
        } else {
          console.error(`❌ Guest confirmation failed: ${emailResults.guestEmail.error}`);
        }

        if (emailResults.adminEmail.success) {
          console.warn('📧 Admin notification sent successfully');
        } else {
          console.error(`❌ Admin notification failed: ${emailResults.adminEmail.error}`);
        }
      }
    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
      // Don't fail the RSVP submission if email service fails
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/thank-you', // You would need to create a thank-you page
      },
    });
  } catch (error) {
    console.error('RSVP submission error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to submit RSVP. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Get all RSVPs (for testing)
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if we're in development mode
    const isDevMode = !locals.runtime?.env;

    if (isDevMode) {
      // Development mode: return mock data
      return new Response(
        JSON.stringify({
          success: true,
          rsvps: [
            {
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              attending: 'yes',
              vegetarian: 0,
              plus_one: 0,
              submitted_at: new Date().toISOString(),
            },
          ],
        }),
        {
          status: 200,
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

    const result = await locals.runtime.env.DB.prepare(
      `
      SELECT id, first_name, last_name, email, attending, vegetarian, 
             plus_one, plus_one_name, message, language, submitted_at
      FROM rsvp 
      ORDER BY submitted_at DESC
    `
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        rsvps: result.results.map((row) => ({
          ...row,
          submitted_at: new Date(row.submitted_at).toISOString(),
        })),
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
