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

interface ChatbotPreviewProps { // Renamed interface
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

export const ChatbotPreview: React.FC<ChatbotPreviewProps> = ({ // Renamed component
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
            useKnowledgeBase: useKnowledgeBase, // Pass this flag
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.error || 'API request failed');
        }
        
        const data = await response.json();
        const assistantMessage: ChatMessageWithSource = {
          role: 'assistant',
          content: data.choices[0].message.content,
          timestamp: new Date(),
          sourceInfo: { // Include source info
            fromKnowledgeBase: knowledgeSources.length > 0,
            sources: knowledgeSources
          }
        };
        
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
        
      } catch (error) {
        console.error('API call failed:', error);
        
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${(error as Error).message}. Please check your API key or try again later.`,
          timestamp: new Date()
        };
        
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    };
    
    callAPI();
  };
  
  // Reset state when agent changes or widget mounts/unmounts
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return; // Don't reset on initial mount
    }
    
    handleRefresh(); // Refresh chat when agent changes
    
    // Cleanup function when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, [agent]); // Only depends on agent prop change
  
  // Mock responses for testing purposes
  const getBotResponse = (input: string): ChatMessage => {
    input = input.toLowerCase();
    let content = "";
    
    if (input.includes('time')) {
      content = `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (input.includes('date')) {
      content = `Today's date is ${new Date().toLocaleDateString()}.`;
    } else if (input.match(/^\d+\s*\+\s*\d+$/)) { // Simple addition check
      try {
        const result = eval(input.replace(/\s/g, '')); // Basic eval for testing
        content = `${input} = ${result}`;
      } catch {
        content = "Sorry, I couldn't calculate that.";
      }
    } else {
      // Generate a more dynamic response based on the agent's name
      content = agent?.name 
        ? `I'm ${agent.name}, and I'm still learning! You asked about "${input}". How else can I assist you?`
        : `You said: "${input}". How can I help?`;
    }
    
    return {
      role: 'assistant',
      content: content,
      timestamp: new Date()
    };
  };
  
  // Function to render message content with markdown support
  const renderMessageContent = (content: string) => {
    // Basic Markdown support (bold, italic, links)
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
    
    // Find potential URLs (simplified regex)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      // Add the URL as a link
      const url = match[0];
      parts.push(<a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a>);
      lastIndex = match.index + url.length;
    }
    
    // Add any remaining text after the last URL
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts.map((part, index) => <span key={index}>{part}</span>);
  };
  
  const renderMessage = (message: ChatMessageWithSource, index: number) => (
    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`p-3 rounded-lg max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
        <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.content }}></p> {/* Keep existing HTML rendering */}
        
        {/* Display source attribution if available */}
        {message.role === 'assistant' && message.sourceInfo?.fromKnowledgeBase && (
          <div className="mt-2 text-xs text-gray-600 opacity-75">
            Source: Knowledge Base 
            {message.sourceInfo.sources.length > 0 && (
              <span className="ml-1">({message.sourceInfo.sources.join(', ')})</span>
            )}
          </div>
        )}
        
        <span className="text-xs opacity-60 block text-right mt-1">
          {formatMessageTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in input
      handleSendMessage();
    }
  };
  
  const BotAvatar = () => {
    return (
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0" 
        style={{ backgroundColor: primaryColor }} // Use primary color for avatar background
      >
        {agent?.avatar ? (
           <img src={agent.avatar} alt="Bot Avatar" className="w-full h-full object-cover rounded-full" />
         ) : (
           <Bot size={18} className="text-white" /> // Default icon with white color
         )}
      </div>
    );
  };
  
  // Function to determine text color based on background brightness
  const getTextColor = (bgColor: string): string => {
    if (!bgColor) return '#ffffff'; // Default to white if no color provided
    try {
      const color = bgColor.startsWith('#') ? bgColor.substring(1, 7) : bgColor;
      const r = parseInt(color.substring(0, 2), 16); // Red
      const g = parseInt(color.substring(2, 4), 16); // Green
      const b = parseInt(color.substring(4, 6), 16); // Blue
      // Calculate luminance (per WCAG)
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#ffffff'; // Return black for light backgrounds, white for dark
    } catch (e) {
      return '#ffffff'; // Default to white on error
    }
  };
  
  const headerTextColor = getTextColor(headerBackgroundColor); // Calculate header text color
  
  return (
    <Card className={`flex flex-col h-full w-full ${isEmbedded ? 'border-none shadow-none rounded-none' : ''}`} style={{ backgroundColor }}>
      <CardHeader 
        className="flex flex-row items-center justify-between p-3 border-b" 
        style={{ backgroundColor: headerBackgroundColor, color: headerTextColor }}
      >
        <div className="flex items-center">
          <BotAvatar />
          <span className="font-semibold text-sm">{agent?.name || 'AI Assistant'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-7 w-7" style={{ color: headerTextColor }} aria-label="Refresh chat">
            <RefreshCcw size={16} />
          </Button>
          {!isEmbedded && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-7 w-7" style={{ color: headerTextColor }} aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}>
                {isMinimized ? <ChevronLeft size={16} /> : <Minimize2 size={16} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7" style={{ color: headerTextColor }} aria-label="Close chat">
                <X size={16} />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-4 overflow-y-auto">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} /> {/* Element to scroll to */}
          </CardContent>
          
          <CardFooter className="p-3 border-t">
            <div className="flex w-full items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Attach file (coming soon)" disabled>
                <Paperclip size={18} />
              </Button>
              <Input 
                placeholder="Type your message..." 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-9"
              />
              <Button 
                size="icon" 
                className="h-9 w-9" 
                onClick={handleSendMessage} 
                disabled={!messageInput.trim()}
                style={{ backgroundColor: primaryColor, color: getTextColor(primaryColor) }} // Dynamic button color
                aria-label="Send message"
              >
                <Send size={18} />
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}; 