import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Bot, Trash2 } from 'lucide-react';
import { AgentCreationSheet } from './AgentCreationSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getAgents, Agent, deleteAgent } from '@/lib/agents';

export const AgentsCard: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  
  useEffect(() => {
    setAgents(getAgents());
    const handleStorageChange = () => {
      console.log("AgentsCard: Detected storage or agentsUpdated event, refreshing agents.");
      setAgents(getAgents());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agentsUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentsUpdated', handleStorageChange);
    };
  }, []);
  
  const handleOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedAgent(null);
    }
  };

  const handleManageAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsSheetOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (agentToDelete) {
      console.log(`Deleting agent: ${agentToDelete.name} (ID: ${agentToDelete.id})`);
      deleteAgent(agentToDelete.id);
      setAgentToDelete(null);
    }
  };

  const handleDeleteClick = (agent: Agent) => {
    setAgentToDelete(agent);
  };
  
  return (
    <>
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="border-l-4 border-blue-500 pl-4 mb-6">
            <h2 className="text-xl font-semibold">Active agents</h2>
          </div>
          
          {agents.length > 0 ? (
            <div className="space-y-4 w-full">
              {agents.map(agent => (
                <div key={agent.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 overflow-hidden">
                      {agent.avatar ? (
                        <img 
                          src={agent.avatar} 
                          alt={`${agent.name} Avatar`} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Bot size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <p className="text-sm text-gray-500">Model: {agent.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleManageAgent(agent)} 
                    >
                      Manage
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 h-9 w-9"
                      onClick={() => handleDeleteClick(agent)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 w-full mt-4 h-[42px] w-[1085px]" 
                onClick={() => {
                  setSelectedAgent(null);
                  setIsSheetOpen(true);
                }}
              >
                Create a new agent
                <Plus size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 flex-col text-center">
              <p className="text-gray-500 mb-6">
                There are no active agents in this organization.
              </p>
              
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 h-[42px] w-[1085px]" 
                onClick={() => {
                  setSelectedAgent(null);
                  setIsSheetOpen(true);
                }}
              >
                Create a new agent
                <Plus size={16} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AgentCreationSheet 
        isOpen={isSheetOpen} 
        onOpenChange={handleOpenChange} 
        existingAgent={selectedAgent} 
      />

      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agent 
              "<strong>{agentToDelete?.name}</strong>" and remove its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
