// Simple script to send an email directly to a recipient
import dotenv from 'dotenv';
import * as http from 'http';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

// Constants
const PORT = 3001;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/send-email') {
    // Handle email sending request
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const emailData = JSON.parse(body);
        const { to, subject, message } = emailData;
        
        // Validate input
        if (!to || !EMAIL_REGEX.test(to)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid recipient email address' }));
          return;
        }
        
        if (!subject || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Subject and message are required' }));
          return;
        }
        
        // Log the email (in a real app, you would send it)
        const logEntry = `
----- Email Sent -----
To: ${to}
From: ${process.env.EMAIL_USER || 'system@example.com'}
Subject: ${subject}
Date: ${new Date().toISOString()}
Message:
${message}
---------------------
`;
        
        fs.appendFile('email-log.txt', logEntry, (err) => {
          if (err) {
            console.error('Error logging email:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to send email' }));
          } else {
            console.log(`Email to ${to} logged successfully`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Email sent successfully' }));
          }
        });
        
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request format' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/') {
    // Serve a simple form
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Send Email</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          label { display: block; margin-top: 10px; }
          input, textarea { width: 100%; padding: 8px; margin-top: 5px; }
          button { margin-top: 15px; padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
          .result { margin-top: 20px; padding: 10px; border-radius: 4px; }
          .success { background-color: #dff0d8; color: #3c763d; }
          .error { background-color: #f2dede; color: #a94442; }
        </style>
      </head>
      <body>
        <h1>Send Email</h1>
        <div id="emailForm">
          <label for="to">To:</label>
          <input type="email" id="to" name="to" required>
          
          <label for="subject">Subject:</label>
          <input type="text" id="subject" name="subject" required>
          
          <label for="message">Message:</label>
          <textarea id="message" name="message" rows="6" required></textarea>
          
          <button type="button" onclick="sendEmail()">Send Email</button>
        </div>
        
        <div id="result" class="result" style="display: none;"></div>
        
        <script>
          function sendEmail() {
            const to = document.getElementById('to').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            const resultDiv = document.getElementById('result');
            
            if (!to || !subject || !message) {
              resultDiv.className = 'result error';
              resultDiv.textContent = 'All fields are required';
              resultDiv.style.display = 'block';
              return;
            }
            
            fetch('/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, subject, message })
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                resultDiv.className = 'result success';
                resultDiv.textContent = 'Email sent successfully!';
                // Clear form
                document.getElementById('to').value = '';
                document.getElementById('subject').value = '';
                document.getElementById('message').value = '';
              } else {
                resultDiv.className = 'result error';
                resultDiv.textContent = data.error || 'Failed to send email';
              }
              resultDiv.style.display = 'block';
            })
            .catch(error => {
              resultDiv.className = 'result error';
              resultDiv.textContent = 'Error sending email: ' + error.message;
              resultDiv.style.display = 'block';
            });
          }
        </script>
      </body>
      </html>
    `);
  } else {
    // Handle 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Open this URL in your browser to send an email to majdkaznji@gmail.com`);
}); 