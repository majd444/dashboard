// Simple script to test sending email with SendGrid
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables
dotenv.config();

// Get command line arguments
const recipient = process.argv[2];
const subject = process.argv[3];
const message = process.argv[4];

if (!recipient || !subject || !message) {
  console.error('Usage: node test-email.js <recipient> <subject> <message>');
  process.exit(1);
}

// Check if SendGrid API key is set
if (!process.env.SENDGRID_API_KEY) {
  console.error('Error: SENDGRID_API_KEY is not set in your .env file');
  process.exit(1);
}

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create email
const msg = {
  to: recipient,
  from: process.env.EMAIL_USER || 'bookm7704@gmail.com',
  subject: subject,
  text: message,
  html: message.replace(/\n/g, '<br>')
};

// Send email
sgMail.send(msg)
  .then(() => {
    console.log('Email sent successfully!');
  })
  .catch((error) => {
    console.error('Error sending email:');
    console.error(error.toString());
    
    if (error.response) {
      console.error('Response body:');
      console.error(JSON.stringify(error.response.body, null, 2));
    }
  }); 