import type { APIRoute } from 'astro';
import { Resend } from 'resend';
export const prerender = false;

// Simple email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Generate email content for RSVP notification
function generateRSVPEmailContent(data: {
  firstName: string;
  lastName: string;
  email: string;
  attending: string;
  vegetarian: number;
  plusOne: number;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  plusOneVegetarian?: number;
  language: string;
}) {
  const subject = `New RSVP: ${data.firstName} ${data.lastName} - ${data.attending === 'yes' ? 'Attending' : 'Not Attending'}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
        New RSVP Submission
      </h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1f2937;">Guest Information</h3>
        <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Attendance:</strong> <span style="color: ${data.attending === 'yes' ? '#10b981' : '#ef4444'}; font-weight: bold;">
          ${data.attending === 'yes' ? '✓ Attending' : '✗ Not Attending'}
        </span></p>
        <p><strong>Vegetarian Meal:</strong> ${data.vegetarian ? 'Yes' : 'No'}</p>
        <p><strong>Language:</strong> ${data.language.toUpperCase()}</p>
      </div>
      
      ${data.plusOne ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Guest Information</h3>
          <p><strong>Guest Name:</strong> ${data.guestFirstName || ''} ${data.guestLastName || ''}</p>
          <p><strong>Guest Vegetarian Meal:</strong> ${data.plusOneVegetarian ? 'Yes' : 'No'}</p>
        </div>
      ` : ''}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <p>This RSVP was submitted on ${new Date().toLocaleString('en-US', { 
          timeZone: 'UTC',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} UTC</p>
      </div>
    </div>
  `;
  
  return { subject, html };
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    // Check if we're in development mode (no Cloudflare runtime)
    const isDevMode = !locals.runtime?.env;
    
    if (isDevMode) {
      // Development mode: simulate successful submission without database
      console.log('Development mode: Simulating RSVP submission');
      
      const formData = await request.formData();
      const firstName = formData.get('firstName')?.toString().trim();
      const lastName = formData.get('lastName')?.toString().trim();
      const email = formData.get('email')?.toString().trim();
      const attending = formData.get('attendance')?.toString();
      
      console.log('RSVP submitted (dev mode):', { firstName, lastName, email, attending });
      
      // Return success response
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'RSVP submitted successfully (development mode)!',
        id: 'dev-' + Date.now()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if we have database access in production mode
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
    const guestFirstName = formData.get('guestFirstName')?.toString().trim() || null;
    const guestLastName = formData.get('guestLastName')?.toString().trim() || null;
    const plusOneVegetarian = formData.get('plusOneVegetarian') === 'on' ? 1 : 0;
    const language = formData.get('language')?.toString() || 'en';

    // Validation
    const errors: string[] = [];
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Please enter a valid email address');
    if (!attending || !['yes', 'no'].includes(attending)) errors.push('Please select your attendance');
    if (plusOne && (!guestFirstName || !guestLastName)) errors.push('Guest name is required');

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
        plus_one, guest_first_name, guest_last_name, plus_one_vegetarian, 
        language, submitted_at, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
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
    ).run();

    if (!result.success) {
      throw new Error('Failed to insert RSVP');
    }

    console.log('RSVP submitted successfully:', result.meta.last_row_id);

    // Send email notification using Resend
    try {
      // Check if we have the Resend API key
      if (!locals.runtime?.env?.RESEND_WEDDING_API_KEY) {
        console.warn('Resend API key not available - skipping email notification');
      } else {
          console.log('key', locals.runtime.env.RESEND_WEDDING_API_KEY as string)
          const resend = new Resend(locals.runtime.env.RESEND_WEDDING_API_KEY as string);
        
        const emailData = {
          firstName,
          lastName,
          email,
          attending,
          vegetarian,
          plusOne,
          guestFirstName,
          guestLastName,
          plusOneVegetarian,
          language
        };
        
        const { subject, html } = generateRSVPEmailContent(emailData);
        
        const emailResult = await resend.emails.send({
            from: 'information@danaandthomas.party',
            to: 'thomas.merieux@gmail.com',
          subject: subject,
          html: html,
        });
        
        if (emailResult.error) {
          console.error('Failed to send email notification:', emailResult.error);
          // Don't fail the RSVP submission if email fails
        } else {
          console.log('Email notification sent successfully:', emailResult.data?.id);
        }
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the RSVP submission if email fails
    }

      return new Response(null, {
          status: 302,
          headers: {
              'Location': '/thank-you' // You would need to create a thank-you page
          }
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
    // Check if we're in development mode
    const isDevMode = !locals.runtime?.env;
    
    if (isDevMode) {
      // Development mode: return mock data
      return new Response(JSON.stringify({
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
            submitted_at: new Date().toISOString()
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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