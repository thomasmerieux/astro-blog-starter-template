/**
 * Calendar ICS file generation utility
 * Generates .ics calendar files for wedding events
 */

export interface CalendarEvent {
  summary: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerName: string;
  organizerEmail: string;
  uid?: string;
  url?: string;
}

export class CalendarGenerator {
  /**
   * Generate ICS calendar content
   */
  public static generateICS(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
    };

    const uid = event.uid || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@danaandthomas.party`;
    const now = formatDate(new Date());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dana & Thomas Wedding//Wedding RSVP//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText(event.location)}`,
      `ORGANIZER;CN="${escapeText(event.organizerName)}":mailto:${event.organizerEmail}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'SEQUENCE:1',
    ];

    if (event.url) {
      icsContent.push(`URL:${event.url}`);
    }

    icsContent.push(
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'DESCRIPTION:Wedding Reminder - Tomorrow!',
      'ACTION:DISPLAY',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'DESCRIPTION:Wedding starts in 2 hours!',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    );

    return icsContent.join('\r\n');
  }

  /**
   * Generate wedding-specific calendar event
   */
  public static generateWeddingEvent(language: 'en' | 'fr' | 'ro' = 'en'): CalendarEvent {
    const translations = {
      en: {
        summary: 'Dana & Thomas Wedding',
        description: `You're invited to celebrate Dana & Thomas's wedding!

Event Details:
• 5:30 PM - Vin d'honneur (Cocktail Hour)
• 7:00 PM - Dinner & Live Music
• 9:30 PM - Dancing

Dress Code: Black tie optional (formal evening attire)
Parking: Free parking available at venue

We can't wait to celebrate with you!`,
        location: 'Loft Diplomat, Herăstrău Park, Bucharest, Romania'
      },
      fr: {
        summary: 'Mariage de Dana & Thomas',
        description: `Vous êtes invité à célébrer le mariage de Dana & Thomas !

Détails de l'événement :
• 17h30 - Vin d'honneur
• 19h00 - Dîner & Musique live
• 21h30 - Danse

Code vestimentaire : Black tie optionnel (tenue de soirée)
Parking : Parking gratuit disponible sur place

Nous avons hâte de célébrer avec vous !`,
        location: 'Loft Diplomat, Parc Herăstrău, Bucarest, Roumanie'
      },
      ro: {
        summary: 'Nunta Dana & Thomas',
        description: `Sunteți invitați să sărbătoriți nunta Dana & Thomas!

Detalii eveniment:
• 17:30 - Vin d'honneur (Ora cocktail-ului)
• 19:00 - Cină & Muzică live
• 21:30 - Dans

Dress code: Black tie opțional (ținută de seară)
Parking: Parcare gratuită disponibilă la locație

Abia așteptăm să sărbătorim cu voi!`,
        location: 'Loft Diplomat, Parcul Herăstrău, București, România'
      }
    };

    const translation = translations[language];
    
    // Wedding date: September 20, 2025
    const startDate = new Date('2025-09-20T15:30:00.000Z'); // 5:30 PM Romanian time (UTC+3)
    const endDate = new Date('2025-09-21T02:00:00.000Z');   // Late night end time

    return {
      summary: translation.summary,
      description: translation.description,
      location: translation.location,
      startDate,
      endDate,
      organizerName: 'Dana & Thomas',
      organizerEmail: 'wedding@danaandthomas.party',
      url: 'https://danaandthomas.party'
    };
  }

  /**
   * Generate individual events for each part of the wedding
   */
  public static generateWeddingEvents(language: 'en' | 'fr' | 'ro' = 'en'): CalendarEvent[] {
    const translations = {
      en: {
        cocktail: {
          summary: 'Dana & Thomas Wedding - Cocktail Hour',
          description: 'Join us for a cocktail hour before the main celebration. Enjoy drinks and appetizers while we gather together.'
        },
        dinner: {
          summary: 'Dana & Thomas Wedding - Dinner & Ceremony',
          description: 'The main wedding celebration with dinner, ceremony, and live music.'
        },
        dancing: {
          summary: 'Dana & Thomas Wedding - Dancing',
          description: 'Let the party continue! Join us on the dance floor for the evening celebration.'
        },
        location: 'Loft Diplomat, Herăstrău Park, Bucharest, Romania'
      },
      fr: {
        cocktail: {
          summary: 'Mariage Dana & Thomas - Vin d\'honneur',
          description: 'Rejoignez-nous pour un vin d\'honneur avant la célébration principale. Profitez de boissons et d\'amuse-bouches pendant que nous nous rassemblons.'
        },
        dinner: {
          summary: 'Mariage Dana & Thomas - Dîner & Cérémonie',
          description: 'La célébration principale du mariage avec dîner, cérémonie et musique live.'
        },
        dancing: {
          summary: 'Mariage Dana & Thomas - Danse',
          description: 'Laissons la fête continuer ! Rejoignez-nous sur la piste de danse pour la célébration du soir.'
        },
        location: 'Loft Diplomat, Parc Herăstrău, Bucarest, Roumanie'
      },
      ro: {
        cocktail: {
          summary: 'Nunta Dana & Thomas - Cocktail',
          description: 'Alăturați-vă pentru un cocktail înainte de sărbătoarea principală. Bucurați-vă de băuturi și aperitive în timp ce ne adunăm împreună.'
        },
        dinner: {
          summary: 'Nunta Dana & Thomas - Cină & Ceremonie',
          description: 'Sărbătoarea principală a nunții cu cină, ceremonie și muzică live.'
        },
        dancing: {
          summary: 'Nunta Dana & Thomas - Dans',
          description: 'Să continue petrecerea! Alăturați-vă pe pista de dans pentru sărbătoarea de seară.'
        },
        location: 'Loft Diplomat, Parcul Herăstrău, București, România'
      }
    };

    const translation = translations[language];
    
    const events: CalendarEvent[] = [
      // Cocktail Hour: 5:30 PM - 7:00 PM
      {
        summary: translation.cocktail.summary,
        description: translation.cocktail.description,
        location: translation.location,
        startDate: new Date('2025-09-20T15:30:00.000Z'),
        endDate: new Date('2025-09-20T17:00:00.000Z'),
        organizerName: 'Dana & Thomas',
        organizerEmail: 'wedding@danaandthomas.party',
        url: 'https://danaandthomas.party'
      },
      // Dinner & Ceremony: 7:00 PM - 9:30 PM
      {
        summary: translation.dinner.summary,
        description: translation.dinner.description,
        location: translation.location,
        startDate: new Date('2025-09-20T17:00:00.000Z'),
        endDate: new Date('2025-09-20T19:30:00.000Z'),
        organizerName: 'Dana & Thomas',
        organizerEmail: 'wedding@danaandthomas.party',
        url: 'https://danaandthomas.party'
      },
      // Dancing: 9:30 PM - Late
      {
        summary: translation.dancing.summary,
        description: translation.dancing.description,
        location: translation.location,
        startDate: new Date('2025-09-20T19:30:00.000Z'),
        endDate: new Date('2025-09-21T02:00:00.000Z'),
        organizerName: 'Dana & Thomas',
        organizerEmail: 'wedding@danaandthomas.party',
        url: 'https://danaandthomas.party'
      }
    ];

    return events;
  }

  /**
   * Generate a download-ready ICS file
   */
  public static createDownloadableICS(event: CalendarEvent, filename?: string): {
    content: string;
    filename: string;
    mimeType: string;
  } {
    const content = this.generateICS(event);
    const defaultFilename = `${event.summary.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    
    return {
      content,
      filename: filename || defaultFilename,
      mimeType: 'text/calendar'
    };
  }

  /**
   * Generate multiple ICS files for all wedding events
   */
  public static createWeddingCalendarFiles(language: 'en' | 'fr' | 'ro' = 'en'): Array<{
    content: string;
    filename: string;
    mimeType: string;
  }> {
    const events = this.generateWeddingEvents(language);
    
    return events.map((event, index) => {
      const eventType = index === 0 ? 'cocktail' : index === 1 ? 'dinner' : 'dancing';
      const filename = `dana_thomas_wedding_${eventType}.ics`;
      
      return this.createDownloadableICS(event, filename);
    });
  }
}