import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  User, 
  GitBranch, 
  Package, 
  Users, 
  HelpCircle, 
  Settings,
  MailPlus 
} from 'lucide-react';

export const Sidebar = () => {
  return (
    <div className="min-h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="text-xl font-bold">LOGO XX</div>
      </div>
      
      <div className="flex-1">
        <nav className="mt-4 px-2">
          <SidebarItem icon={<Home size={20} />} label="Home" path="/" active />
          <SidebarItem icon={<User size={20} />} label="Agent" path="/agent" />
          <SidebarItem icon={<GitBranch size={20} />} label="Workflow" path="/workflow" />
          <SidebarItem icon={<Package size={20} />} label="Plugins" path="/plugins" />
          <SidebarItem icon={<Users size={20} />} label="Team" path="/team" />
          <SidebarItem icon={<MailPlus size={20} />} label="Tools" path="/tools" />
          <SidebarItem icon={<HelpCircle size={20} />} label="Help" path="/help" />
          <SidebarItem icon={<Settings size={20} />} label="Settings" path="/settings" />
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
            A
          </div>
          <div>
            <div className="text-sm font-medium">Account</div>
            <div className="text-xs text-gray-500">Token number 0000</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
}

const SidebarItem = ({ icon, label, path, active = false }: SidebarItemProps) => {
  return (
    <Link 
      to={path} 
      className={`flex items-center space-x-3 px-3 py-2.5 rounded-md mb-1 ${
        active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="text-current">{icon}</div>
      <span className="font-medium">{label}</span>
    </Link>
  );
};
