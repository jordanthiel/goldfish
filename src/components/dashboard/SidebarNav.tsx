
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Video, 
  MessageSquare, 
  Settings, 
  FileCheck 
} from 'lucide-react';
import SidebarItem from './SidebarItem';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SidebarNav = ({ activeTab, setActiveTab }: SidebarNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      name: 'Session Notes',
      icon: <FileText className="h-5 w-5" />,
      value: 'notes',
      path: '/dashboard/notes',
    },
    {
      name: 'Video Consultations',
      icon: <Video className="h-5 w-5" />,
      value: 'video',
      path: '/dashboard/video',
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

  // Determine active tab based on current path and update the tab
  React.useEffect(() => {
    const currentPath = location.pathname;
    
    // Special case for client details page
    if (currentPath.includes('/therapist/client/')) {
      setActiveTab('clients');
      return;
    }
    
    // Handle the dashboard routes
    if (currentPath === '/dashboard') {
      setActiveTab('overview');
      return;
    }
    
    // Handle the path-based tab activation
    const dashboardPrefix = '/dashboard/';
    if (currentPath.startsWith(dashboardPrefix)) {
      const tabName = currentPath.slice(dashboardPrefix.length);
      setActiveTab(tabName);
      return;
    }
    
    // Legacy path handling (can be removed after migration)
    const matchingItem = sidebarItems.find(item => 
      currentPath === item.path || 
      (item.path !== '/dashboard' && currentPath.includes(item.path))
    );
    
    if (matchingItem) {
      setActiveTab(matchingItem.value);
    }
  }, [location.pathname, setActiveTab]);

  const handleTabClick = (value: string, path: string) => {
    setActiveTab(value);
    navigate(path);
  };

  return (
    <div className="flex-1">
      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground">MAIN MENU</h3>
      </div>
      <div className="px-1">
        {sidebarItems.map((item) => (
          <SidebarItem
            key={item.value}
            name={item.name}
            icon={item.icon}
            value={item.value}
            path={item.path}
            isActive={activeTab === item.value}
            onClick={handleTabClick}
          />
        ))}
      </div>
    </div>
  );
};

export default SidebarNav;
