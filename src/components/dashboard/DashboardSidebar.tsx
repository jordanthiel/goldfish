
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Video,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardSidebar = ({ activeTab, setActiveTab }: DashboardSidebarProps) => {
  // Mock user data
  const user = {
    name: 'Dr. Amy Johnson',
    email: 'amy.johnson@example.com',
    role: 'Therapist',
    profilePicture: null, // In a real app, this would be the URL to the profile picture
  };

  const sidebarItems = [
    {
      name: 'Overview',
      icon: <LayoutDashboard className="h-5 w-5" />,
      value: 'overview',
    },
    {
      name: 'Clients',
      icon: <Users className="h-5 w-5" />,
      value: 'clients',
    },
    {
      name: 'Calendar',
      icon: <Calendar className="h-5 w-5" />,
      value: 'calendar',
    },
    {
      name: 'Session Notes',
      icon: <FileText className="h-5 w-5" />,
      value: 'notes',
    },
    {
      name: 'Video Consultations',
      icon: <Video className="h-5 w-5" />,
      value: 'video',
    },
    {
      name: 'Messages',
      icon: <MessageSquare className="h-5 w-5" />,
      value: 'messages',
    },
    {
      name: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      value: 'settings',
    },
  ];

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="flex flex-col items-start gap-2 px-4 py-4">
        <div className="flex w-full items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-xl gradient-text">Goldfish</span>
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col h-full">
        <div className="flex-1">
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium text-muted-foreground">MAIN MENU</h3>
          </div>
          <div className="px-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.value}
                variant={activeTab === item.value ? 'secondary' : 'ghost'}
                className={`w-full justify-start text-base font-medium mb-1 ${
                  activeTab === item.value ? '' : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab(item.value)}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium text-muted-foreground">HELP & SUPPORT</h3>
          </div>
          <div className="px-1">
            <Button variant="ghost" className="w-full justify-start text-base font-medium mb-1 text-muted-foreground">
              <HelpCircle className="h-5 w-5" />
              <span className="ml-3">Help Center</span>
            </Button>
          </div>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="px-3 py-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.profilePicture || undefined} />
              <AvatarFallback className="bg-therapy-purple text-white">AJ</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
