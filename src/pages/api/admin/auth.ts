import type { APIRoute } from 'astro';

export const prerender = false;

// Simple admin authentication
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const formData = await request.formData();
    const password = formData.get('password')?.toString();

    // Get admin password from Cloudflare environment variables
    const ADMIN_PASSWORD = locals.runtime?.env?.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (password === ADMIN_PASSWORD) {
      // Set secure session cookie
      cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid password',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Authentication failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('admin_session');
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
