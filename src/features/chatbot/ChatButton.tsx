import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { ChatbotWidget } from './ChatbotWidget';
import { Agent } from '@/lib/agents';

interface ChatButtonProps {
  agent: Agent | null;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ agent }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => {
    console.log("Opening chat with agent:", agent);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    console.log("Closing chat");
    setIsChatOpen(false);
  };

  return (
    <>
      <Button 
        onClick={handleOpenChat}
        className="bg-green-500 hover:bg-green-600 text-white fixed bottom-4 right-4 z-50"
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Chat with AI
      </Button>

      {isChatOpen && (
        <div className="fixed top-20 right-0 h-3/4 w-1/4 z-[9999] shadow-xl border-l border-gray-200 rounded-tl-lg">
          <div className="relative h-full bg-white overflow-hidden flex flex-col">
            <Button 
              className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white" 
              onClick={handleCloseChat}
            >
              Close
            </Button>
            <div className="flex-1 overflow-y-auto">
              <ChatbotWidget 
                agent={agent} 
                onClose={handleCloseChat}
                isEmbedded={true}
                customStyles={{
                  primaryColor: agent?.primaryColor || '#3B82F6',
                  backgroundColor: agent?.backgroundColor || '#F3F4F6'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 