import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Clock } from 'lucide-react';
import { getAgents } from '@/lib/agents';

const WorkflowPage = () => {
  // Not using agents yet but keeping the import for future implementation
  const _agents = getAgents();
  
  return (
    <div className="flex-1 p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Bot History & Deployment</h1>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Deploy Your Bot</h2>
          <p className="text-gray-600 mb-6">Integrate your bot with your website or application</p>
          
          <Tabs defaultValue="embed">
            <TabsList className="mb-4">
              <TabsTrigger value="embed">Embed Code</TabsTrigger>
              <TabsTrigger value="settings">Chat Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="embed">
              <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">HTML</span>
                  <Button variant="ghost" size="sm" className="h-6 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </Button>
                </div>
                <code className="text-sm block text-gray-800">
                  &lt;script src="https://bot-builder-studio.com/embed.js" data-bot-id="your-bot-id"&gt;&lt;/script&gt;
                </code>
              </div>
              
              <div className="flex gap-4">
                <Button className="flex-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Download Config
                </Button>
                <Button variant="outline" className="flex-1">
                  Share
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="space-y-4">
                <div>
                  <Label className="block font-medium mb-2">Chat Title</Label>
                  <Input placeholder="Chat with AI" defaultValue="Chat with AI" className="max-w-md" />
                </div>
                
                <div>
                  <Label className="block font-medium mb-2">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500"></div>
                    <Input type="text" defaultValue="#3B82F6" className="max-w-xs w-32" />
                  </div>
                </div>
                
                <div>
                  <Label className="block font-medium mb-2">Background Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                    <Input type="text" defaultValue="#F3F4F6" className="max-w-xs w-32" />
                  </div>
                </div>
                
                <div>
                  <Label className="block font-medium mb-2">Outside Text</Label>
                  <Input defaultValue="Chat with our AI assistant!" className="max-w-md" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Conversation History</h2>
          <p className="text-gray-600 mb-6">View past interactions with your bot</p>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Recent Conversations</h3>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Clock size={16} />
              Last 7 days
            </Button>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-lg border text-center mb-6">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h4 className="text-lg font-medium mb-2">No conversation history yet</h4>
            <p className="text-gray-500">Conversation history will appear here once users start chatting with your bot.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-sm text-gray-500">Total Conversations</div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">0%</div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">0m</div>
              <div className="text-sm text-gray-500">Avg. Conversation Time</div>
            </div>
          </div>
          
          <Button>
            View Detailed Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowPage;
