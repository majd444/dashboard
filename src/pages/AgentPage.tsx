import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Bot, Settings, MessageSquare } from 'lucide-react';
import { AgentCreationSheet } from '@/features/agent-management/AgentCreationSheet';
import { ChatbotWidget } from '@/features/chatbot/ChatbotWidget';
import { ChatButton } from '@/features/chatbot/ChatButton';
import { getAgents, Agent } from '@/lib/agents';

const AgentPage = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatbotAgent, setChatbotAgent] = useState<Agent | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
  useEffect(() => {
    // Load agents when component mounts
    setAgents(getAgents());
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      setAgents(getAgents());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for local updates
    window.addEventListener('agentsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentsUpdated', handleStorageChange);
    };
  }, []);
  
  // Refresh agents list when sheet closes
  const handleOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedAgent(null);
      setAgents(getAgents());
    }
  };

  const handleConfigureAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsSheetOpen(true);
  };

  const handleTestChatbot = (agent: Agent) => {
    setChatbotAgent(agent);
    setIsChatbotOpen(true);
  };

  return (
    <>
      <div className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Agent Management</h1>
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            onClick={() => setIsSheetOpen(true)}
          >
            <Plus size={16} />
            Create a new agent
          </Button>
        </div>
        
        {agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <Card key={agent.id} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 overflow-hidden">
                        {agent.avatar ? (
                          <img 
                            src={agent.avatar} 
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Bot size={28} />
                        )}
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">{agent.name}</h2>
                        <p className="text-sm text-gray-500">Created {new Date(agent.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{agent.prompt}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      {agent.model}
                    </span>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      Temperature: {agent.temperature}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => handleConfigureAgent(agent)}
                    >
                      <Settings size={16} className="mr-2" />
                      Configure
                    </Button>
                    <Button 
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => handleTestChatbot(agent)}
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center">
              <div className="py-12 flex flex-col items-center">
                <Bot size={48} className="text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No agents created yet</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create your first AI agent to start building powerful conversational experiences.
                </p>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  onClick={() => setIsSheetOpen(true)}
                >
                  <Plus size={16} />
                  Create a new agent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <AgentCreationSheet 
          isOpen={isSheetOpen} 
          onOpenChange={handleOpenChange} 
          existingAgent={selectedAgent}
        />
      </div>

      {isChatbotOpen && (
        <div className="fixed top-20 right-0 h-3/4 w-1/4 z-[9999] shadow-xl border-l border-gray-200 rounded-tl-lg">
          <div className="relative h-full bg-white overflow-hidden flex flex-col">
            <Button 
              className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white" 
              onClick={() => setIsChatbotOpen(false)}
            >
              Close
            </Button>
            <div className="flex-1 overflow-y-auto">
              <ChatbotWidget 
                agent={chatbotAgent} 
                onClose={() => setIsChatbotOpen(false)}
                isEmbedded={true}
                customStyles={{
                  primaryColor: chatbotAgent?.primaryColor || '#3B82F6',
                  backgroundColor: chatbotAgent?.backgroundColor || '#F3F4F6'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {agents.length > 0 && !isChatbotOpen && (
        <ChatButton agent={agents[0]} />
      )}
    </>
  );
};

export default AgentPage;
