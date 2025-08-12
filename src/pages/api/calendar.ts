import type { APIRoute } from 'astro';
import { CalendarGenerator } from '../../utils/calendar';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get language from query parameter, default to 'en'
    const language = (url.searchParams.get('lang') || 'en') as 'en' | 'fr' | 'ro';
    
    // Get event type from query parameter
    const eventType = url.searchParams.get('event') || 'full';

    if (eventType === 'full') {
      // Generate the full wedding event
      const weddingEvent = CalendarGenerator.generateWeddingEvent(language);
      const calendarFile = CalendarGenerator.createDownloadableICS(weddingEvent);

      return new Response(calendarFile.content, {
        status: 200,
        headers: {
          'Content-Type': calendarFile.mimeType,
          'Content-Disposition': `attachment; filename="${calendarFile.filename}"`,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    } else {
      // Generate individual events
      const events = CalendarGenerator.generateWeddingEvents(language);
      const eventIndex = eventType === 'cocktail' ? 0 : eventType === 'dinner' ? 1 : eventType === 'dancing' ? 2 : -1;

      if (eventIndex === -1 || !events[eventIndex]) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid event type. Use: cocktail, dinner, dancing, or full' 
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const calendarFile = CalendarGenerator.createDownloadableICS(events[eventIndex]);

      return new Response(calendarFile.content, {
        status: 200,
        headers: {
          'Content-Type': calendarFile.mimeType,
          'Content-Disposition': `attachment; filename="${calendarFile.filename}"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (error) {
    console.error('Calendar generation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate calendar file',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};