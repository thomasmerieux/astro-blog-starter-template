// Quick test script to verify email templates
import { generateGuestConfirmationEmail, generateAdminNotificationEmail } from './src/utils/emailTemplates.js';

const testData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  attending: 'yes',
  vegetarian: 1,
  plusOne: 1,
  guestFirstName: 'Jane',
  guestLastName: 'Doe',
  plusOneVegetarian: 0,
  language: 'en',
  weddingDate: 'September 20, 2025',
  venueName: 'Loft Diplomat',
  venueAddress: 'Herăstrău Park, Bucharest, Romania',
  coupleNames: 'Dana & Thomas'
};

console.log('=== GUEST CONFIRMATION EMAIL ===');
const guestEmail = generateGuestConfirmationEmail(testData);
console.log('Subject:', guestEmail.subject);
console.log('HTML length:', guestEmail.html.length, 'characters');

console.log('\n=== ADMIN NOTIFICATION EMAIL ===');
const adminEmail = generateAdminNotificationEmail(testData);
console.log('Subject:', adminEmail.subject);
console.log('HTML length:', adminEmail.html.length, 'characters');

console.log('\n✅ Email templates generated successfully!');