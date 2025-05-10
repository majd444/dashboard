import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from 'lucide-react';
import { AgentCreationSheet } from '../features/agent-management/AgentCreationSheet';

export const SearchBar = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  return (
    <>
      <div className="flex justify-between items-center w-full mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        
        <Button 
          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
          onClick={() => setIsSheetOpen(true)}
        >
          <Plus size={16} />
          Create a new agent
        </Button>
      </div>

      <AgentCreationSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
};
