import React from 'react';
import { PlanCard } from './PlanCard';
import { OperationsCard } from './OperationsCard';
import { AgentsCard } from '../agent-management/AgentsCard';

export const Dashboard = () => {
  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
      
      {/* Grid for PlanCard and OperationsCard side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div> 
          <PlanCard />
        </div>
        <div> 
          <OperationsCard /> 
        </div>
      </div>

      {/* AgentsCard below the grid */}
      <AgentsCard /> 

    </div>
  );
};
