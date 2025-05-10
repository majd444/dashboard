// Simple script to test OpenRouter API connectivity
const apiKey = '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';
const modelId = 'nvidia/llama-3.1-nemotron-nano-8b-v1:free';

async function testAPI() {
  console.log('Testing OpenRouter API connection...');
  console.log(`Using model: ${modelId}`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://dashy-visual-hub.example.com',
        'X-Title': 'Dashy Visual Hub API Test'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Say hello and introduce yourself in one short sentence."
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (Status ${response.status}):`, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('\nSuccess! The API returned:');
      console.log('-------------------------------------');
      console.log(data.choices[0].message.content);
      console.log('-------------------------------------');
      console.log('\nAPI is working correctly!');
    } else {
      console.error('API returned unexpected data structure:', data);
    }
  } catch (error) {
    console.error('Error making API request:', error.message);
  }
}

// Run the test
testAPI(); 