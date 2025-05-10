/**
 * Communication Tools Backend Module
 * 
 * A lightweight Node.js module providing email and calendar functionality using Google APIs.
 * 
 * ## Features
 * 
 * - Send emails via Gmail using OAuth2 authentication
 * - Create, list, and delete Google Calendar events
 * - Simple OAuth2 flow helpers for authentication
 * - Easily integrable into any Node.js application
 * 
 * ## Installation
 * 
 * 1. Add the module to your project:
 *    ```
 *    npm install googleapis nodemailer dotenv
 *    ```
 * 
 * 2. Set up environment variables:
 *    Create a `.env` file with the following variables:
 *    ```
 *    GOOGLE_CLIENT_ID=your_client_id_here
 *    GOOGLE_CLIENT_SECRET=your_client_secret_here
 *    GOOGLE_REDIRECT_URI=your_redirect_uri_here
 *    GOOGLE_REFRESH_TOKEN=your_refresh_token_here
 *    EMAIL_USER=your_gmail_address@gmail.com
 *    CALENDAR_ID=primary
 *    ```
 * 
 * ## Google Cloud Setup
 * 
 * 1. Create a Google Cloud Platform project:
 *    - Go to https://console.cloud.google.com/
 *    - Create a new project
 *    - Enable Gmail API and Google Calendar API
 *    - Configure OAuth consent screen
 *    - Create OAuth credentials (Web application type)
 *    - Add your redirect URI (e.g., `http://localhost:3000/auth/google/callback`)
 * 
 * 2. Once you have your credentials, add them to your `.env` file.
 */

import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Communication Tools backend module
 * Provides email and calendar functionality without UI
 */
class CommTools {
  constructor(config = {}) {
    // Use provided config or fall back to environment variables
    this.config = {
      clientId: config.clientId || process.env.GOOGLE_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: config.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4201/auth/google/callback',
      refreshToken: config.refreshToken || process.env.GOOGLE_REFRESH_TOKEN,
      emailUser: config.emailUser || process.env.EMAIL_USER,
      calendarId: config.calendarId || process.env.CALENDAR_ID || 'primary',
      timeZone: config.timeZone || 'America/Los_Angeles'
    };

    // Create OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );

    // Set credentials if refresh token is available
    if (this.config.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: this.config.refreshToken
      });
    }

    // Initialize API clients
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Get authorization URL for OAuth2 consent
   * @param {Array} scopes - Array of OAuth scopes
   * @return {String} Authorization URL
   */
  getAuthUrl(scopes = []) {
    const defaultScopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    const authScopes = scopes.length > 0 ? scopes : defaultScopes;
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: authScopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param {String} code - Authorization code from redirect
   * @return {Object} Tokens including refresh_token
   */
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new Error(`Failed to get tokens: ${error.message}`);
    }
  }

  /**
   * Set refresh token
   * @param {String} refreshToken - OAuth refresh token
   */
  setRefreshToken(refreshToken) {
    this.config.refreshToken = refreshToken;
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
  }

  /**
   * Send email using Gmail API directly
   * @param {Object} emailOptions - Email options
   * @param {String} emailOptions.to - Recipient email
   * @param {String} emailOptions.subject - Email subject
   * @param {String} emailOptions.text - Plain text body
   * @param {String} emailOptions.html - HTML body (optional)
   * @return {Object} Send result
   */
  async sendEmail({ to, subject, text, html }) {
    try {
      // Create base64 encoded email
      const emailLines = [
        `To: ${to}`,
        `From: ${this.config.emailUser}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        html || `<div>${text}</div>`
      ];

      const email = emailLines.join('\r\n');
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the email using Gmail API directly
      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });
      
      console.log('Email sent using Gmail API:', result.data);
      return {
        success: true,
        messageId: result.data.id,
        threadId: result.data.threadId
      };
    } catch (error) {
      console.error('Gmail API Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Create a calendar event
   * @param {Object} eventOptions - Event details
   * @param {String} eventOptions.summary - Event title
   * @param {String} eventOptions.location - Event location (optional)
   * @param {String} eventOptions.description - Event description (optional)
   * @param {Date|String} eventOptions.startTime - Event start time
   * @param {Date|String} eventOptions.endTime - Event end time
   * @param {Array} eventOptions.attendees - Array of attendee emails (optional)
   * @param {Array} eventOptions.reminders - Reminder settings (optional)
   * @return {Object} Created event details
   */
  async createCalendarEvent({
    summary,
    location,
    description,
    startTime,
    endTime,
    attendees = [],
    reminders = { useDefault: true }
  }) {
    try {
      // Format start and end times
      const start = {
        dateTime: startTime instanceof Date ? startTime.toISOString() : startTime,
        timeZone: this.config.timeZone
      };
      
      const end = {
        dateTime: endTime instanceof Date ? endTime.toISOString() : endTime,
        timeZone: this.config.timeZone
      };
      
      // Format attendees
      const formattedAttendees = attendees.map(email => ({ email }));
      
      // Prepare event details
      const eventDetails = {
        summary,
        location,
        description,
        start,
        end,
        attendees: formattedAttendees,
        reminders
      };
      
      // Create the calendar event
      const event = await this.calendar.events.insert({
        calendarId: this.config.calendarId,
        resource: eventDetails
      });
      
      return {
        success: true,
        eventId: event.data.id,
        htmlLink: event.data.htmlLink,
        details: event.data
      };
    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  /**
   * List upcoming calendar events
   * @param {Object} options - Options for listing events
   * @param {Number} options.maxResults - Maximum number of events to return
   * @param {String} options.timeMin - Start time for fetching events
   * @return {Array} List of calendar events
   */
  async listCalendarEvents({ maxResults = 10, timeMin = new Date().toISOString() } = {}) {
    try {
      const response = await this.calendar.events.list({
        calendarId: this.config.calendarId,
        timeMin,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      return response.data.items;
    } catch (error) {
      throw new Error(`Failed to list calendar events: ${error.message}`);
    }
  }

  /**
   * Delete a calendar event
   * @param {String} eventId - ID of the event to delete
   * @return {Object} Delete result
   */
  async deleteCalendarEvent(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: this.config.calendarId,
        eventId
      });
      
      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }
}

/**
 * Example usage of the CommTools module
 */
async function exampleUsage() {
  // Initialize with config (or it will use environment variables)
  const commTools = new CommTools({
    // Uncomment and set these if not using environment variables
    // clientId: 'your-client-id',
    // clientSecret: 'your-client-secret',
    // redirectUri: 'your-redirect-uri',
    // refreshToken: 'your-refresh-token',
    // emailUser: 'your-email@gmail.com',
    // calendarId: 'primary',
    // timeZone: 'America/Los_Angeles'
  });

  // If you don't have a refresh token yet, get auth URL and open it in a browser
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    const authUrl = commTools.getAuthUrl();
    console.log('Open this URL to authorize the application:');
    console.log(authUrl);
    console.log('\nAfter authorization, you will be redirected to your redirect URI with a code parameter.');
    console.log('Use this code to get tokens by calling getTokensFromCode(code).');
    return;
  }

  try {
    // Create a calendar event for tomorrow at 12 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // 12:00 PM

    const endTime = new Date(tomorrow);
    endTime.setHours(13, 0, 0, 0); // 1:00 PM (1 hour duration)

    const eventResult = await commTools.createCalendarEvent({
      summary: 'Appointment', 
      startTime: tomorrow,
      endTime: endTime,
      // Using default reminders
    });

    console.log('Calendar event created:', eventResult);

  } catch (error) {
    console.error('Error in exampleUsage:', error.message);
  }
}

/**
 * Environment Variables Template
 * 
 * # Communication Tools Environment Variables
 * 
 * # Google OAuth2 - Required for both Email and Calendar functionality
 * GOOGLE_CLIENT_ID=your_client_id_here
 * GOOGLE_CLIENT_SECRET=your_client_secret_here
 * GOOGLE_REDIRECT_URI=http://localhost:4201/auth/google/callback
 * GOOGLE_REFRESH_TOKEN=your_refresh_token_here
 * 
 * # Email Settings
 * EMAIL_USER=your_gmail_address@gmail.com
 * 
 * # Calendar Settings
 * CALENDAR_ID=primary
 */

// Export the main CommTools class using ES module syntax
export { CommTools /*, exampleUsage */ };

// Execute exampleUsage if the script is run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  exampleUsage().catch(console.error);
} 