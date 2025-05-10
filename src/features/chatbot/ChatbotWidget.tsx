import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, ChevronLeft, Minimize2, Paperclip, RefreshCcw, Send, X } from 'lucide-react';
import { Agent } from '@/lib/agents';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  includeLink?: boolean;
  linkUrl?: string;
  sourceInfo?: {
    fromKnowledgeBase: boolean;
    sources: string[];
  };
}

interface CustomStyles {
  primaryColor?: string;
  backgroundColor?: string;
  headerBackgroundColor?: string;
}

interface ChatbotWidgetProps {
  agent: Agent | null;
  onClose: () => void;
  isEmbedded?: boolean;
  customStyles?: CustomStyles;
}

// Define a type for knowledge base search results
interface KnowledgeSearchResult {
  content: string;
  relevance: number;
  source: string;
}

// Add a new interface for messages with knowledge base info
interface ChatMessageWithSource extends ChatMessage {
  sourceInfo?: {
    fromKnowledgeBase: boolean;
    sources: string[];
  };
}

// Helper function to format message timestamps
const formatMessageTime = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  // Less than 1 minute ago
  if (diffSec < 60) {
    return 'just now';
  }
  // Less than 1 hour ago
  else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  }
  // Today
  else if (diffHour < 24 && timestamp.getDate() === now.getDate()) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Not today
  else {
    return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ 
  agent, 
  onClose,
  isEmbedded = false,
  customStyles = {}
}) => {
  // Create a function to generate welcome message based on prompt
  const getWelcomeMessage = () => {
    if (agent?.prompt) {
      const promptLower = agent.prompt.toLowerCase();
      
      // Special handling for "act like" prompts
      if (promptLower.includes('act like')) {
        if (promptLower.includes('dog')) {
          return "Woof woof! *wags tail excitedly* Hello new friend! I'm a good doggo! *pants happily*";
        }
        if (promptLower.includes('cat')) {
          return "Meow... *slowly opens one eye* Oh, it's you. I suppose I can grace you with my presence. *stretches leisurely*";
        }
        // Generic fallback for other "act like" prompts
        return `Hello! ${agent.prompt}. How can I help you today?`;
      }
    }
    
    // Default welcome message
    return agent?.name 
      ? `👋 Hi, I'm ${agent.name}! I can help with information, answer questions, or just chat. Try asking me about math (like "1+1"), the current time, or anything else!`
      : 'Hi, How can I help you today?';
  };

  const [messages, setMessages] = useState<ChatMessageWithSource[]>([
    {
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  
  // Extract custom styles or use defaults
  const { 
    primaryColor = agent?.primaryColor || '#1f2937', 
    backgroundColor = agent?.backgroundColor || '#ffffff', 
    headerBackgroundColor = customStyles.headerBackgroundColor || agent?.primaryColor || '#1f2937'
  } = customStyles;
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle refresh - reset the chat to initial state
  const handleRefresh = () => {
    setMessages([
      {
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date(),
      }
    ]);
    setMessageInput('');
  };

  const handleSendMessage = () => {
    if (messageInput.trim() === '') return;
    
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageInput,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setMessageInput('');
    
    // Add loading message
    const loadingMessage: ChatMessage = {
      role: 'assistant',
      content: '...',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, loadingMessage]);

    // Capture the current messages for API calls
    const currentMessages = [...messages, userMessage];
    
    // Function to call API with fallback options
    const callAPI = async () => {
      try {
        // Remove the loading message
        setMessages(prevMessages => prevMessages.filter(msg => msg.content !== '...'));
        
        // Check if knowledge base is enabled for this agent
        const useKnowledgeBase = agent?.knowledgeBase?.enabled && agent?.knowledgeBase?.datasets?.length > 0;
        
        // Create proper messages array for API
        const apiMessages = [
          {
            role: "system", 
            content: agent?.prompt?.toLowerCase().includes('act like')
              ? `IMPORTANT INSTRUCTION: ${agent.prompt}. You must stay in character at all times.`
              : agent?.prompt || "You are a helpful AI assistant."
          },
          ...currentMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          }))
        ];
        
        console.log('Sending to API:', {
          model: "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
          messages: apiMessages,
          apiKey: agent?.apiKey ? `${agent.apiKey.substring(0, 5)}...` : 'none',
          useKnowledgeBase
        });
        
        // If knowledge base is enabled, first search for relevant information
        let knowledgeContext = '';
        let knowledgeSources: string[] = [];
        if (useKnowledgeBase) {
          try {
            // Fetch relevant information from knowledge base
            const searchResponse = await fetch('/api/knowledge-search', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: messageInput,
                datasets: agent.knowledgeBase.datasets
              })
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.results && searchData.results.length > 0) {
                // Extract relevant information from search results
                knowledgeContext = "Information from knowledge base:\n\n" + 
                  searchData.results.map((result: KnowledgeSearchResult) => 
                    `${result.content.substring(0, 500)}...`
                  ).join('\n\n');
                
                // Collect sources for attribution
                const sources = searchData.results.map((result: KnowledgeSearchResult) => result.source);
                
                console.log('Retrieved knowledge context:', knowledgeContext.substring(0, 100) + '...');
                
                // Add knowledge context to system message
                apiMessages[0].content += `\n\nRelevant information from the knowledge base:\n${knowledgeContext}`;
                
                // Store this for displaying source attribution later
                knowledgeSources = sources;
              }
            }
          } catch (kbError) {
            console.error('Knowledge base search error:', kbError);
            // Continue without knowledge base if search fails
          }
        }
        
        // Use local proxy server to avoid CORS issues
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${agent?.apiKey}`
          },
          body: JSON.stringify({
            model: "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
            messages: apiMessages,
            temperature: agent?.temperature || 0.7,
            // Add flag to let backend know we want to use knowledge base
            useKnowledgeBase: useKnowledgeBase,
            knowledgeDatasets: agent?.knowledgeBase?.datasets
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API response status: ${response.status}, Body:`, errorText);
          throw new Error(`API responded with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('OpenRouter API Response Data:', data);
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const botResponse: ChatMessageWithSource = {
            role: 'assistant',
            content: data.choices[0].message.content,
            timestamp: new Date(),
            sourceInfo: knowledgeSources.length > 0 ? {
              fromKnowledgeBase: true,
              sources: knowledgeSources
            } : undefined
          };
          setMessages(prevMessages => [...prevMessages, botResponse]);
        } else {
          throw new Error(data.error?.message || 'No valid response content from API');
        }
      } catch (error) {
        console.error('API call error:', error);
        
        // Check if it's a specific error type
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // For CORS errors, try alternative OpenAI-style implementation
        if (errorMessage.includes('CORS') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
          try {
            console.log('Trying alternative OpenAI-style approach...');
            
            // This is a hypothetical implementation similar to what the user suggested
            // In a real implementation, you would use the OpenAI SDK
            const alternativeResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${agent?.apiKey}`
              },
              body: JSON.stringify({
                model: "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
                messages: [
                  {
                    role: "system",
                    // Emphasize the prompt if it contains "act like"
                    content: agent?.prompt?.toLowerCase().includes('act like')
                      ? `IMPORTANT INSTRUCTION: ${agent.prompt}. You must stay in character at all times.`
                      : agent?.prompt || "You are a helpful AI assistant."
                  },
                  {
                    role: "user", 
                    content: messageInput
                  }
                ]
              })
            });
            
            if (alternativeResponse.ok) {
              const alternativeData = await alternativeResponse.json();
              if (alternativeData.choices && alternativeData.choices[0] && alternativeData.choices[0].message) {
                const altBotResponse: ChatMessage = {
                  role: 'assistant',
                  content: alternativeData.choices[0].message.content,
                  timestamp: new Date()
                };
                setMessages(prevMessages => [...prevMessages, altBotResponse]);
                return; // Exit early if successful
              }
            }
            // If we got here, the alternative also failed
            throw new Error('Alternative approach also failed');
          } catch (altError) {
            console.error('Alternative API approach failed:', altError);
            // Continue to regular fallback
          }
          
          const corsMessage: ChatMessage = {
            role: 'assistant',
            content: "I'm having trouble connecting to my brain due to browser security restrictions (CORS). This commonly happens with API calls from browsers. Let me fall back to my local knowledge instead.",
            timestamp: new Date()
          };
          setMessages(prevMessages => [...prevMessages, corsMessage]);
        }
        
        // Fallback to simulated response
        const botResponse = getBotResponse(messageInput);
        setMessages(prevMessages => [...prevMessages, botResponse]);
      }
    };
    
    // Make a real API call if we have an API key
    if (agent?.apiKey && (agent.model === 'nvidia-llama-3.1-nemotron-nano-8b' || agent.model === 'nvidia/llama-3.1-nemotron-nano-8b-v1:free')) {
      callAPI();
    } else {
      // Fallback to simulated response if no API key or different model
      setTimeout(() => {
        // Remove the loading message
        setMessages(prevMessages => prevMessages.filter(msg => msg.content !== '...'));
        
        const botResponse = getBotResponse(messageInput);
        setMessages(prevMessages => [...prevMessages, botResponse]);
      }, 1000);
    }
  };

  // Generate bot response with optional links
  const getBotResponse = (input: string): ChatMessage => {
    const lowercaseInput = input.toLowerCase().trim();
    
    // Check for calendar availability queries
    if (lowercaseInput.includes('calendar') || 
        lowercaseInput.includes('schedule') || 
        lowercaseInput.includes('available time') || 
        lowercaseInput.includes('free time') || 
        lowercaseInput.includes('availability')) {
      
      // Get next week's dates
      const today = new Date();
      const nextWeekDates = [];
      
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        nextWeekDates.push(nextDate);
      }
      
      // Generate random available time slots
      const timeSlots = ['9:00 AM', '11:30 AM', '2:00 PM', '3:30 PM', '5:00 PM'];
      const availableSlots = [];
      
      // Pick 3 random days and times
      for (let i = 0; i < 3; i++) {
        const randomDayIndex = Math.floor(Math.random() * nextWeekDates.length);
        const randomTimeIndex = Math.floor(Math.random() * timeSlots.length);
        
        const day = nextWeekDates[randomDayIndex];
        const time = timeSlots[randomTimeIndex];
        
        const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
        const monthDay = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        availableSlots.push(`${dayName}, ${monthDay} at ${time}`);
        
        // Remove used dates and times to avoid duplicates
        nextWeekDates.splice(randomDayIndex, 1);
        timeSlots.splice(randomTimeIndex, 1);
      }
      
      return {
        role: 'assistant',
        content: `Here are three available time slots in your calendar for next week:\n\n1. ${availableSlots[0]}\n2. ${availableSlots[1]}\n3. ${availableSlots[2]}\n\nWould you like me to schedule an appointment in one of these slots?`,
        timestamp: new Date()
      };
    }
    
    // Check if it's a knowledge base query
    if (agent?.knowledgeBase?.enabled && 
        agent?.knowledgeBase?.datasets?.length > 0 &&
        (lowercaseInput.includes('knowledge') || lowercaseInput.includes('document') || lowercaseInput.includes('database'))) {
      return {
        role: 'assistant',
        content: `I'll use my knowledge base to help with that. Let me search through the information I have about "${input}".`,
        timestamp: new Date()
      };
    }
    
    // Special handling for "act like" prompts
    if (agent?.prompt && agent.prompt.toLowerCase().includes('act like')) {
      const actAs = agent.prompt.toLowerCase();
      
      // Act like a dog responses
      if (actAs.includes('dog')) {
        return {
          role: 'assistant',
          content: "Woof woof! *wags tail* " + 
            (lowercaseInput.includes('fetch') ? "I'll fetch that for you! *runs excitedly*" : 
            lowercaseInput.includes('treat') ? "*ears perk up* Did someone say treat?! *panting*" : 
            lowercaseInput.includes('walk') ? "*jumps around* Walk?! I love walks! Let's go! *pulls on leash*" :
            "*tilts head* Woof! *pants happily*"),
          timestamp: new Date()
        };
      }
      
      // Act like a cat responses
      if (actAs.includes('cat')) {
        return {
          role: 'assistant',
          content: "Meow... " + 
            (lowercaseInput.includes('food') ? "*stares at you judgmentally* I expect premium food only." : 
            lowercaseInput.includes('pet') ? "*purrs softly* I'll allow you to pet me... for now." : 
            "*ignores you and licks paw* I'll think about responding later."),
          timestamp: new Date()
        };
      }
      
      // Default "act like" response
      return {
        role: 'assistant',
        content: `I'm acting as instructed: "${agent.prompt}". How can I help you in this role?`,
        timestamp: new Date()
      };
    }
    
    // Empty or very short inputs
    if (lowercaseInput.length < 2) {
      return {
        role: 'assistant',
        content: "I didn't catch that. Could you please provide more details or ask a complete question?",
        timestamp: new Date()
      };
    }
    
    // Greetings
    if (lowercaseInput.match(/^(hi|hello|hey|howdy|greetings|what's up|sup)/i)) {
      return {
        role: 'assistant',
        content: `Hi ${agent ? agent.name : 'there'}! How can I assist you today?`,
        timestamp: new Date()
      };
    }
    
    // Questions about the model, API, or capabilities
    if (lowercaseInput.includes('model') || lowercaseInput.includes('llm') || lowercaseInput.includes('api')) {
      return {
        role: 'assistant',
        content: agent 
          ? `I'm using ${agent.model === 'nvidia-llama-3.1-nemotron-nano-8b' || agent.model === 'nvidia/llama-3.1-nemotron-nano-8b-v1:free' ? 'NVIDIA Llama 3.1 Nemotron Nano 8B via OpenRouter API' : agent.model} ${agent.apiKey ? ' with your provided API key' : ''}.` 
          : "I'm using a default AI model.",
        timestamp: new Date()
      };
    }
    
    // Check for basic math operations like 1+1
    if (/^[\d\s+\-*/()\\.]+$/.test(lowercaseInput)) {
      try {
        // Carefully evaluate simple math expressions
        /* eslint-disable-next-line no-eval */
        const result = eval(lowercaseInput);
        return {
          role: 'assistant',
          content: `${lowercaseInput} = ${result}`,
          timestamp: new Date()
        };
      } catch (_e) {
        // If eval fails, continue to default response
      }
    }
    
    // Time-related queries
    if (lowercaseInput.includes('time') || lowercaseInput.includes('date') || lowercaseInput.includes('day')) {
      const now = new Date();
      return {
        role: 'assistant',
        content: `The current time is ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}.`,
        timestamp: new Date()
      };
    }
    
    // Help or capabilities questions
    if (lowercaseInput.includes('help') || lowercaseInput.includes('can you') || lowercaseInput.includes('what can you')) {
      return {
        role: 'assistant',
        content: `I can help with various tasks including:\n- Answering questions\n- Doing basic math calculations\n- Telling you the time\n- Having a friendly conversation\n\nWhat would you like help with today?`,
        timestamp: new Date()
      };
    }
    
    // Weather questions (simulate since we don't have a weather API)
    if (lowercaseInput.includes('weather')) {
      return {
        role: 'assistant',
        content: "I don't have access to real-time weather data. To get accurate weather information, you might want to check a weather service like Weather.com or use a weather app on your device.",
        timestamp: new Date()
      };
    }
    
    // Generic fallback response with conversation continuation
    const genericResponses = [
      `I'd be happy to discuss "${input}" further. Could you provide more details about what specifically you'd like to know?`,
      `That's an interesting topic. What aspect of "${input}" are you most curious about?`,
      `I'd like to help with your question about "${input}". Could you elaborate a bit more?`,
      `I understand you're asking about "${input}". To give you the best response, could you clarify what you're looking for?`
    ];
    
    // Select a random response for variety
    const randomIndex = Math.floor(Math.random() * genericResponses.length);
    
    return {
      role: 'assistant',
      content: agent 
        ? `I'm ${agent.name}${agent.model === 'nvidia-llama-3.1-nemotron-nano-8b' || agent.model === 'nvidia/llama-3.1-nemotron-nano-8b-v1:free' ? ', powered by NVIDIA Llama 3.1' : ''}. ${genericResponses[randomIndex]}` 
        : genericResponses[randomIndex],
      timestamp: new Date()
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Determine avatar or use default Bot icon
  const BotAvatar = () => {
    if (agent?.avatar) {
      return (
        <img 
          src={agent.avatar} 
          alt={`${agent.name || 'AI'} Avatar`} 
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    return <Bot size={24} />;
  };
  
  // Determine text color based on background brightness
  const getTextColor = (bgColor: string): string => {
    if (!bgColor) return '#FFFFFF'; // Default white
    try {
      const color = bgColor.startsWith('#') ? bgColor.substring(1) : bgColor;
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#FFFFFF'; // Dark text on light bg, White text on dark bg
    } catch (e) {
      console.error("Failed to parse color:", bgColor, e);
      return '#FFFFFF'; // Default white on error
    }
  };
  
  const headerTextColor = getTextColor(headerBackgroundColor);
  const buttonTextColor = getTextColor(primaryColor);
  
  // Render minimized state
  if (isMinimized && !isEmbedded) {
    return (
        <Button 
        className="fixed bottom-4 right-4 w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-[9999]"
        style={{ backgroundColor: primaryColor, color: buttonTextColor }}
          onClick={() => setIsMinimized(false)}
        >
          <Bot size={28} />
        </Button>
    );
  }

  return (
    <div className={`flex flex-col h-full w-full ${isEmbedded ? 'relative' : 'fixed bottom-4 right-4 z-[9999] rounded-lg shadow-xl overflow-hidden'}`} style={{ backgroundColor }}>
      {/* Header */}
      <CardHeader 
        className="p-3 flex flex-row items-center justify-between space-y-0 text-white"
        style={{ backgroundColor: headerBackgroundColor, color: headerTextColor }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 overflow-hidden">
            {agent?.avatar ? (
              <img 
                src={agent.avatar} 
                alt={`${agent.name || 'AI'} Avatar`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <Bot size={20} style={{ color: headerTextColor === '#FFFFFF' ? '#FFFFFF' : '#6B7280' }} /> 
            )}
          </div>
          <span className="font-semibold">{agent?.name || 'AI Assistant'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleRefresh} style={{ color: headerTextColor }}>
            <RefreshCcw size={16} />
          </Button>
          {!isEmbedded && (
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsMinimized(true)} style={{ color: headerTextColor }}>
            <Minimize2 size={16} />
          </Button>
          )}
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose} style={{ color: headerTextColor }}>
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      
      {/* Chat Messages */}
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[75%] p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              style={msg.role === 'user' ? { backgroundColor: primaryColor, color: buttonTextColor } : {}}
              >
              {msg.content}
              {msg.sourceInfo && msg.sourceInfo.fromKnowledgeBase && (
                <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                  <p className="font-semibold mb-1">Sources:</p>
                  <ul className="list-disc list-inside space-y-1">
                      {msg.sourceInfo.sources.map((source, i) => (
                      <li key={i} className="truncate" title={source}>{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      
      {/* Input Area */}
      <CardFooter className="p-3 border-t">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            style={{ backgroundColor: primaryColor, color: buttonTextColor }}
          >
            <Send size={18} />
          </Button>
        </div>
      </CardFooter>
    </div>
  );
};
