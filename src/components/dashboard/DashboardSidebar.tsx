
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SidebarNav from './SidebarNav';
import SidebarHelp from './SidebarHelp';
import SidebarProfile from './SidebarProfile';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardSidebar = ({ activeTab, setActiveTab }: DashboardSidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

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
        <SidebarNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
        
        <SidebarHelp />
      </SidebarContent>
      
      <SidebarFooter className="px-3 py-4 border-t">
        <SidebarProfile 
          fullName={user?.user_metadata?.full_name || "Therapist"}
          email={user?.email}
          avatarUrl={user?.user_metadata?.avatar_url}
          onSignOut={handleSignOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
