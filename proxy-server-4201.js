/**
 * Simple Express server to proxy requests to the OAuth server
 * This resolves CORS and other connectivity issues
 */
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4201;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware to log the body of requests
app.use((req, res, next) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    console.log('Incoming request body:');
    if (req.body && req.body.messages && req.body.messages.length > 0) {
      // Log the system prompt
      const systemPrompt = req.body.messages.find(msg => msg.role === 'system');
      if (systemPrompt) {
        console.log('System prompt:', systemPrompt.content);
      }
      
      // Log user messages
      const userMessages = req.body.messages.filter(msg => msg.role === 'user');
      if (userMessages.length > 0) {
        console.log('Latest user message:', userMessages[userMessages.length - 1].content);
      }
    }
  }
  next();
});

// Proxy API requests to OpenRouter
app.use('/api/chat', createProxyMiddleware({
  target: 'https://openrouter.ai',
  changeOrigin: true,
  pathRewrite: {
    '^/api/chat': '/api/v1/chat/completions'
  },
  onProxyReq: (proxyReq, req, _res) => {
    // Ensure the authorization header is forwarded correctly
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    
    // Add required OpenRouter headers
    proxyReq.setHeader('HTTP-Referer', 'https://dashy-visual-hub.example.com');
    proxyReq.setHeader('X-Title', 'Dashy Visual Hub API Test');
    
    // If we've already parsed the body (as JSON), we need to rewrite the body
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      // Update content-length
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Write body to request
      proxyReq.write(bodyData);
    }
  }
}));

// Serve static files from the public directory
app.use(express.static('dist'));

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`To use, send requests to http://localhost:${PORT}/api/chat`);
});
