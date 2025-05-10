/**
 * Direct Gmail API Email Sender
 * 
 * Sends emails using the Gmail API directly without Nodemailer.
 * This approach uses OAuth2 authentication that's already working with calendar events.
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4201/auth/google/callback'
);

// Set credentials using the refresh token
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  console.log('OAuth2 credentials set with refresh token');
} else {
  console.error('Error: GOOGLE_REFRESH_TOKEN is not set in .env file');
  // Don't exit here to allow the module to be imported
}

// Initialize Gmail API client
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Creates a base64 encoded email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @returns {string} - Base64 encoded email
 */
function createEmail(to, subject, htmlContent) {
  const senderEmail = process.env.EMAIL_USER || process.env.GOOGLE_EMAIL;
  if (!senderEmail) {
    throw new Error('Email sender address not configured (EMAIL_USER or GOOGLE_EMAIL)');
  }
  
  const emailLines = [
    `To: ${to}`,
    `From: ${senderEmail}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    htmlContent
  ];

  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sends an email using the Gmail API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @returns {Promise<object>} - Send result
 */
async function sendGmailDirect(to, subject, htmlContent) {
  try {
    // Create the email content
    const encodedEmail = createEmail(to, subject, htmlContent);
    
    // Send the email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    console.log('Email sent successfully:', result.data);
    return { 
      success: true, 
      messageId: result.data.id,
      threadId: result.data.threadId
    };
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Function to get command line arguments
function getCommandLineArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node send-gmail-direct.js <recipient> <subject> <message>');
    return null;
  }
  
  return {
    recipient: args[0],
    subject: args[1],
    message: args[2]
  };
}

// Main function
async function main() {
  // Get command line arguments
  const args = getCommandLineArgs();
  
  if (!args) {
    return;
  }
  
  // Format the HTML content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2>${args.subject}</h2>
      <p>${args.message.replace(/\n/g, '<br>')}</p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Sent using Gmail API Direct method
      </p>
    </div>
  `;
  
  try {
    // Send the email
    const result = await sendGmailDirect(args.recipient, args.subject, htmlContent);
    console.log('Success!', result);
  } catch (error) {
    console.error('Failed to send email:', error.message);
    process.exit(1);
  }
}

// Run the script if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

// Export functions for use in other modules
export { sendGmailDirect, createEmail }; 