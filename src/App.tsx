import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import Index from "./pages/Index";
import AgentPage from "./pages/AgentPage";
import WorkflowPage from "./pages/WorkflowPage";
import PluginsPage from "./pages/PluginsPage";
import TeamPage from "./pages/TeamPage";
import HelpPage from "./pages/HelpPage";
import SettingsPage from "./pages/SettingsPage";
import ToolsPage from "./pages/ToolsPage";
import NotFound from "./pages/NotFound";
import React, { useState, useRef, useEffect } from 'react';
import './styles/index.css'; // Assuming global styles including Tailwind are imported here

const queryClient = new QueryClient();

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const App = () => {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messageInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const openChatModal = () => setIsChatModalOpen(true);
  const closeChatModal = () => setIsChatModalOpen(false);

  const handleSendMessage = () => {
    const messageText = currentMessage.trim();
    if (messageText) {
      const newMessage: Message = {
        id: Date.now(), // simple unique id
        text: messageText,
        sender: 'user',
      };
      setChatMessages((prevMessages) => [...prevMessages, newMessage]);
      setCurrentMessage('');

      // --- TODO: Add logic to send message to bot and display response ---
      // Example: simulateBotResponse(messageText);
    }
  };

  const handleRefreshChat = () => {
    setChatMessages([]);
    // Optionally add a default bot message back
    // setChatMessages([{ id: Date.now(), text: 'Chat cleared. How can I help?', sender: 'bot' }]);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(event.target.value);
  };

  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout onOpenChat={openChatModal} />}>
              <Route path="/" element={<Index />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/workflow" element={<WorkflowPage />} />
              <Route path="/plugins" element={<PluginsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>

      {/* Chatbot preview modal - Integrated with React state */}
      {isChatModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={(e) => { 
            // Close if clicking overlay directly
            if (e.target === e.currentTarget) {
              closeChatModal();
            }
          }}
        >
          <div className="bg-white flex flex-col rounded-lg w-96 h-[600px] max-h-[80vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center p-3 bg-gray-800 text-white">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                  <i className="ri-robot-line text-sm"></i>
                </div>
                <h3 className="font-semibold text-base">AI Assistant</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={handleRefreshChat} className="text-gray-300 hover:text-white">
                  <i className="ri-refresh-line text-lg"></i>
                </button>
                <button onClick={closeChatModal} className="text-gray-300 hover:text-white">
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>
            {/* Message Area */}
            <div ref={chatMessagesContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-100">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 rounded-lg inline-block max-w-[80%] ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            {/* Input Area */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-center">
                <label htmlFor="preview-message-input" className="sr-only">Chat message input</label>
                <input
                  ref={messageInputRef}
                  type="text"
                  id="preview-message-input"
                  name="preview_message_input"
                  value={currentMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleInputKeyPress}
                  className="flex-1 py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-2"
                  placeholder="Type your message..."
                />
                <button onClick={handleSendMessage} className="bg-blue-500 text-white p-2 rounded-lg w-10 h-10 flex items-center justify-center hover:bg-blue-600">
                  <i className="ri-send-plane-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
};

export default App;
