import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from 'lucide-react';

export const OperationsCard = () => {
  return (
    <Card className="border border-gray-200 w-[550px] h-[250px]">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Operations</h2>
          <div className="flex items-center">
            <span>Monthly</span>
            <ChevronDown size={16} className="ml-1" />
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-2 bg-gray-100 rounded-full w-full mt-2 flex">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full mx-0.5 ${
                      i % 3 === 0 ? 'bg-blue-200 w-8' : 'bg-gray-200 w-8'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm text-gray-500">Current operations</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-500">Monthly</div>
              <div className="text-sm text-gray-500">Billing interval</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
