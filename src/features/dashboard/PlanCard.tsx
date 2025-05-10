import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from 'lucide-react';

export const PlanCard = () => {
  return (
    <Card className="border border-gray-200 w-[550px] h-[250px]">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Current plan: Free</h2>
          <div className="flex items-center">
            <span>Monthly</span>
            <ChevronDown size={16} className="ml-1" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold text-blue-500">$0</div>
            <div className="text-sm text-gray-500">Current cost</div>
          </div>
          <div>
            <div className="text-3xl font-bold">0.00</div>
            <div className="text-sm text-gray-500">Usage</div>
          </div>
          <div>
            <div className="text-3xl font-bold">5,000</div>
            <div className="text-sm text-gray-500">Monthly limit</div>
          </div>
        </div>

        <div className="mt-6">
          <Button variant="outline" size="sm">
            Upgrade plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
