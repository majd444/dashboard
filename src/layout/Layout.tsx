import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// Define props type
interface LayoutProps {
  onOpenChat: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ onOpenChat }) => (
  <div className="flex h-screen bg-background">
    <Sidebar />
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Simple Header added directly */}
      <header className="flex items-center justify-between p-4 border-b bg-card text-card-foreground">
        {/* Placeholder for other header content maybe? */}
        <div className="text-lg font-semibold">Dashboard</div> 
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
      {/* Fixed Chat Button (Restored) */}
      <button 
        onClick={onOpenChat} 
        className="fixed bottom-5 right-5 z-50 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open Chat"
      >
        <i className="ri-chat-3-line mr-1"></i> 
        <span>Chat</span>
      </button>
    </div>
  </div>
);
