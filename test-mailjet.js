// Simple script to test sending email with Mailjet SMTP
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up transporter using Mailjet SMTP
const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILJET_API_KEY || 'YOUR_MAILJET_API_KEY',  // Replace with your Mailjet API key
    pass: process.env.MAILJET_SECRET_KEY || 'YOUR_MAILJET_SECRET_KEY'  // Replace with your Mailjet secret key
  }
});

// Get command line arguments
const recipient = process.argv[2] || 'majdkaznji@gmail.com';
const subject = process.argv[3] || 'Test Email from Mailjet';
const message = process.argv[4] || 'This is a test email sent via Mailjet SMTP.';

// Define email data
const mailOptions = {
  from: process.env.EMAIL_USER || 'bookm7704@gmail.com',
  to: recipient,
  subject: subject,
  text: message,
  html: `<h1>${subject}</h1><p>${message}</p>`
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent successfully:', info.response);
  }
}); 