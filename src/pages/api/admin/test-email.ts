import type { APIRoute } from 'astro';
import { EmailService } from '../../../utils/emailService';

export const prerender = false;

// Helper function to check admin authentication
function isAdminAuthenticated(cookies: any): boolean {
  return cookies.get('admin_session')?.value === 'authenticated';
}

// Test email configuration endpoint
export const POST: APIRoute = async ({ cookies, locals, request }) => {
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

    // Get email to send test to
    const formData = await request.formData();
    const testEmail = formData.get('email')?.toString();

    if (!testEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email address required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if we have API key
    const apiKey =
      locals.runtime?.env?.API_KEY_RESEND || locals.runtime?.env?.RESEND_WEDDING_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email API key not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize email service
    const emailService = new EmailService({
      apiKey: apiKey as string,
      from: 'Dana & Thomas <wedding@danaandthomas.party>',
      adminEmail: testEmail,
    });

    // Test the configuration
    const result = await emailService.testConfiguration();

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Test email sent to ${testEmail}`,
          messageId: result.messageId,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Email test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to test email configuration',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
