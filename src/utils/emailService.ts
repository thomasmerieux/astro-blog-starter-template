import { Resend } from 'resend';
import type { RSVPData } from './emailTemplates';
import { generateGuestConfirmationEmail, generateAdminNotificationEmail } from './emailTemplates';

export interface EmailConfig {
  from: string;
  adminEmail: string | string[];
  apiKey: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private resend: Resend;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.resend = new Resend(config.apiKey);
  }

  // Send confirmation email to guest with retry logic
  async sendGuestConfirmation(rsvpData: RSVPData): Promise<EmailResult> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { subject, html } = generateGuestConfirmationEmail(rsvpData);

        const result = await this.resend.emails.send({
          from: this.config.from,
          to: rsvpData.email,
          subject,
          html,
          tags: [
            { name: 'type', value: 'guest-confirmation' },
            { name: 'attending', value: rsvpData.attending },
            { name: 'language', value: rsvpData.language },
          ],
        });

        if (result.error) {
          throw new Error(`Resend API error: ${result.error.message}`);
        }

        console.warn(`✅ Guest confirmation sent to ${rsvpData.email} (attempt ${attempt})`);
        return {
          success: true,
          messageId: result.data?.id,
        };
      } catch (error) {
        console.error(
          `❌ Attempt ${attempt}/${maxRetries} failed for guest email to ${rsvpData.email}:`,
          error
        );

        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Failed to send guest confirmation after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    return {
      success: false,
      error: 'Unexpected error in email service',
    };
  }

  // Send notification to admin
  async sendAdminNotification(rsvpData: RSVPData): Promise<EmailResult> {
    const maxRetries = 2; // Fewer retries for admin notifications
    const retryDelay = 500; // Shorter delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { subject, html } = generateAdminNotificationEmail(rsvpData);

        const result = await this.resend.emails.send({
          from: this.config.from,
          to: this.config.adminEmail,
          subject,
          html,
          tags: [
            { name: 'type', value: 'admin-notification' },
            { name: 'attending', value: rsvpData.attending },
          ],
        });

        if (result.error) {
          throw new Error(`Resend API error: ${result.error.message}`);
        }

        console.warn(`📧 Admin notification sent (attempt ${attempt})`);
        return {
          success: true,
          messageId: result.data?.id,
        };
      } catch (error) {
        console.error(`❌ Admin notification attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Failed to send admin notification after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    return {
      success: false,
      error: 'Unexpected error in admin notification',
    };
  }

  // Send both emails with proper error handling
  async sendRSVPEmails(rsvpData: RSVPData): Promise<{
    guestEmail: EmailResult;
    adminEmail: EmailResult;
  }> {
    // Send both emails in parallel for better performance
    const [guestResult, adminResult] = await Promise.allSettled([
      this.sendGuestConfirmation(rsvpData),
      this.sendAdminNotification(rsvpData),
    ]);

    const guestEmail: EmailResult =
      guestResult.status === 'fulfilled'
        ? guestResult.value
        : { success: false, error: `Promise rejected: ${guestResult.reason}` };

    const adminEmail: EmailResult =
      adminResult.status === 'fulfilled'
        ? adminResult.value
        : { success: false, error: `Promise rejected: ${adminResult.reason}` };

    return { guestEmail, adminEmail };
  }

  // Test email configuration
  async testConfiguration(): Promise<EmailResult> {
    try {
      const testData: RSVPData = {
        firstName: 'Test',
        lastName: 'User',
        email: this.config.adminEmail, // Send test to admin
        attending: 'yes',
        vegetarian: 0,
        plusOne: 0,
        language: 'en',
        weddingDate: 'September 20, 2025',
        venueName: 'Loft Diplomat',
        venueAddress: 'Bucharest, Romania',
        coupleNames: 'Dana & Thomas',
      };

      const { subject, html } = generateGuestConfirmationEmail(testData);

      const result = await this.resend.emails.send({
        from: this.config.from,
        to: this.config.adminEmail,
        subject: `${subject}`,
        html,
        tags: [{ name: 'type', value: 'test' }],
      });

      if (result.error) {
        throw new Error(`Test email failed: ${result.error.message}`);
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: `Email configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export { EmailService };
