// Simple proxy server to bypass CORS restrictions
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fetch from 'node-fetch';

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Log all requests
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

// Middleware to handle knowledge base integration
app.use(async (req, res, next) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    // Check if knowledge base is enabled
    if (req.body.useKnowledgeBase && req.body.knowledgeDatasets) {
      try {
        console.log('Knowledge base integration enabled');
        console.log('Datasets:', req.body.knowledgeDatasets);
        
        // Get the user's query (last user message)
        const userMessages = req.body.messages.filter(msg => msg.role === 'user');
        if (userMessages.length > 0) {
          const latestUserMessage = userMessages[userMessages.length - 1].content;
          
          // Search the knowledge base
          const searchResponse = await fetch('http://localhost:5050/api/knowledge-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: latestUserMessage,
              datasets: req.body.knowledgeDatasets
            })
          });
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`Found ${searchData.count} relevant knowledge base items`);
            
            if (searchData.results && searchData.results.length > 0) {
              // Extract relevant information from search results
              const knowledgeContext = searchData.results.map(result => 
                `${result.source}: ${result.content.substring(0, 500)}...`
              ).join('\n\n');
              
              // Enhance the system prompt with knowledge base content
              const systemPromptIndex = req.body.messages.findIndex(msg => msg.role === 'system');
              if (systemPromptIndex !== -1) {
                req.body.messages[systemPromptIndex].content += `\n\nRelevant information from the knowledge base:\n${knowledgeContext}`;
                console.log('Enhanced system prompt with knowledge base data');
              } else {
                // Add a new system prompt if none exists
                req.body.messages.unshift({
                  role: 'system',
                  content: `You are a helpful assistant with access to the following information:\n\n${knowledgeContext}`
                });
                console.log('Added new system prompt with knowledge base data');
              }
            }
          } else {
            console.error('Error searching knowledge base:', await searchResponse.text());
          }
        }
      } catch (error) {
        console.error('Knowledge base integration error:', error);
        // Continue with regular processing even if knowledge base search failed
      }
    }
    
    // Remove the extra fields that OpenRouter doesn't need
    delete req.body.useKnowledgeBase;
    delete req.body.knowledgeDatasets;
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`To use, send requests to http://localhost:${PORT}/api/chat`);
}); 