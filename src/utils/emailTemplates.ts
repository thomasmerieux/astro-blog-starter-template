// Email template system for wedding RSVP confirmations
export interface RSVPData {
  firstName: string;
  lastName: string;
  email: string | string[];
  attending: string;
  vegetarian: number;
  plusOne: number;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  plusOneVegetarian?: number;
  language: string;
  weddingDate: string;
  venueName: string;
  venueAddress: string;
  coupleNames: string;
}

// Base email styles
const emailStyles = {
  container:
    'font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;',
  header:
    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;',
  headerTitle:
    'color: #ffffff; font-size: 28px; font-weight: normal; margin: 0; letter-spacing: 2px;',
  headerSubtitle: 'color: #f0f4f8; font-size: 16px; margin: 10px 0 0 0;',
  content: 'padding: 40px 30px; line-height: 1.6;',
  section:
    'margin-bottom: 30px; padding: 25px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;',
  sectionTitle: 'color: #2d3748; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;',
  text: 'color: #4a5568; font-size: 16px; margin: 0 0 15px 0;',
  highlight: 'color: #667eea; font-weight: 600;',
  footer: 'background-color: #2d3748; padding: 30px; text-align: center; color: #a0aec0;',
  button:
    'display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;',
};

// Generate guest confirmation email for attending guests
export function generateGuestConfirmationEmail(data: RSVPData): { subject: string; html: string } {
  const isAttending = data.attending === 'yes';

  const subject = isAttending
    ? `✨ RSVP Confirmed: ${data.coupleNames} Wedding - ${data.weddingDate}`
    : `RSVP Received: ${data.coupleNames} Wedding`;

  const attendanceMessage = isAttending
    ? `<div style="${emailStyles.section}">
         <h3 style="${emailStyles.sectionTitle}">🎉 We're so excited you'll be joining us!</h3>
         <p style="${emailStyles.text}">
           Thank you for confirming your attendance at our wedding celebration. 
           We can't wait to celebrate this special day with you!
         </p>
       </div>`
    : `<div style="${emailStyles.section}">
         <h3 style="${emailStyles.sectionTitle}">💙 Thank you for letting us know</h3>
         <p style="${emailStyles.text}">
           We understand you won't be able to join us on our special day. 
           Thank you for taking the time to respond, and we'll be thinking of you!
         </p>
       </div>`;

  const eventDetails = isAttending
    ? `
    <div style="${emailStyles.section}">
      <h3 style="${emailStyles.sectionTitle}">📍 Event Details</h3>
      <p style="${emailStyles.text}">
        <strong style="${emailStyles.highlight}">Date:</strong> ${data.weddingDate}<br>
        <strong style="${emailStyles.highlight}">Venue:</strong> ${data.venueName}<br>
        <strong style="${emailStyles.highlight}">Address:</strong> ${data.venueAddress}<br>
        <strong style="${emailStyles.highlight}">Time:</strong> 17:30 (Vin d'honneur) | 19:00 (Dinner)
      </p>
    </div>
  `
    : '';

  const rsvpDetails = `
    <div style="${emailStyles.section}">
      <h3 style="${emailStyles.sectionTitle}">📋 Your RSVP Details</h3>
      <p style="${emailStyles.text}">
        <strong style="${emailStyles.highlight}">Guest:</strong> ${data.firstName} ${data.lastName}<br>
        <strong style="${emailStyles.highlight}">Email:</strong> ${data.email}<br>
        <strong style="${emailStyles.highlight}">Attending:</strong> ${isAttending ? 'Yes ✓' : 'No'}<br>
        ${data.vegetarian ? `<strong style="${emailStyles.highlight}">Dietary:</strong> Vegetarian meal requested<br>` : ''}
        ${
          data.plusOne
            ? `
          <strong style="${emailStyles.highlight}">Plus One:</strong> ${data.guestFirstName} ${data.guestLastName}<br>
          ${data.plusOneVegetarian ? `<strong style="${emailStyles.highlight}">Guest Dietary:</strong> Vegetarian meal requested<br>` : ''}
        `
            : ''
        }
      </p>
    </div>
  `;

  const changesNote = isAttending
    ? `
    <div style="${emailStyles.section}">
      <h3 style="${emailStyles.sectionTitle}">✏️ Need to Make Changes?</h3>
      <p style="${emailStyles.text}">
        If you need to update your RSVP or have any questions, please contact us directly. 
        We're here to help make sure everything is perfect for our special day!
      </p>
    </div>
  `
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RSVP Confirmation - ${data.coupleNames}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f7fafc;">
      <div style="${emailStyles.container}">
        <!-- Header -->
        <div style="${emailStyles.header}">
          <h1 style="${emailStyles.headerTitle}">${data.coupleNames}</h1>
          <p style="${emailStyles.headerSubtitle}">${data.weddingDate}</p>
        </div>
        
        <!-- Content -->
        <div style="${emailStyles.content}">
          <p style="${emailStyles.text}">Dear ${data.firstName},</p>
          
          ${attendanceMessage}
          ${eventDetails}
          ${rsvpDetails}
          ${changesNote}
          
          <p style="${emailStyles.text}">
            With love and excitement,<br>
            <strong style="${emailStyles.highlight}">Dana & Thomas</strong>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="${emailStyles.footer}">
          <p style="margin: 0; font-size: 14px;">
            This email was sent because you submitted an RSVP for our wedding.<br>
            If you have any questions, please reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// Generate admin notification email (existing functionality)
export function generateAdminNotificationEmail(data: RSVPData): { subject: string; html: string } {
  const subject = `New RSVP: ${data.firstName} ${data.lastName} - ${data.attending === 'yes' ? 'Attending' : 'Not Attending'}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New RSVP Submission</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f7fafc;">
      <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
          <h1 style="${emailStyles.headerTitle}">New RSVP Submission</h1>
        </div>
        
        <div style="${emailStyles.content}">
          <div style="${emailStyles.section}">
            <h3 style="${emailStyles.sectionTitle}">Guest Information</h3>
            <p style="${emailStyles.text}">
              <strong>Name:</strong> ${data.firstName} ${data.lastName}<br>
              <strong>Email:</strong> ${data.email}<br>
              <strong>Attendance:</strong> <span style="color: ${data.attending === 'yes' ? '#10b981' : '#ef4444'}; font-weight: bold;">
                ${data.attending === 'yes' ? '✓ Attending' : '✗ Not Attending'}
              </span><br>
              <strong>Vegetarian Meal:</strong> ${data.vegetarian ? 'Yes' : 'No'}<br>
              <strong>Language:</strong> ${data.language.toUpperCase()}
            </p>
          </div>
          
          ${
            data.plusOne
              ? `
            <div style="${emailStyles.section}">
              <h3 style="${emailStyles.sectionTitle}">Guest Information</h3>
              <p style="${emailStyles.text}">
                <strong>Guest Name:</strong> ${data.guestFirstName || ''} ${data.guestLastName || ''}<br>
                <strong>Guest Vegetarian Meal:</strong> ${data.plusOneVegetarian ? 'Yes' : 'No'}
              </p>
            </div>
          `
              : ''
          }
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
            <p>This RSVP was submitted on ${new Date().toLocaleString('en-US', {
              timeZone: 'UTC',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} UTC</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}
