
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardSidebar = ({ activeTab, setActiveTab }: DashboardSidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get first and last initial for avatar
  const getInitials = () => {
    if (!user) return "?";
    const fullName = user.user_metadata?.full_name || "";
    const nameParts = fullName.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
    }
    return fullName.substring(0, 2);
  };

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

  const sidebarItems = [
    {
      name: 'Overview',
      icon: <LayoutDashboard className="h-5 w-5" />,
      value: 'overview',
      path: '/dashboard',
    },
    {
      name: 'Clients',
      icon: <Users className="h-5 w-5" />,
      value: 'clients',
      path: '/dashboard/clients',
    },
    {
      name: 'Calendar',
      icon: <Calendar className="h-5 w-5" />,
      value: 'calendar',
      path: '/dashboard/calendar',
    },
    {
      name: 'Insurance Claims',
      icon: <FileCheck className="h-5 w-5" />,
      value: 'claims',
      path: '/dashboard/claims',
    },
    {
      name: 'Messages',
      icon: <MessageSquare className="h-5 w-5" />,
      value: 'messages',
      path: '/dashboard/messages',
    },
    {
      name: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      value: 'settings',
      path: '/dashboard/settings',
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
                asChild
              >
                <Link to={item.path}>
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
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
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-therapy-purple text-white">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.user_metadata?.full_name || "Therapist"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
