import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import RootLayout from '@/components/layout/RootLayout';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import ClientList from '@/components/clients/ClientList';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import SessionNotes from '@/components/notes/SessionNotes';
import VideoConsultation from '@/components/video/VideoConsultation';
import InsuranceClaims from '@/components/claims/InsuranceClaims';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the current section from the URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/clients')) return 'clients';
    if (path.includes('/dashboard/calendar')) return 'calendar';
    if (path.includes('/dashboard/notes')) return 'notes';
    if (path.includes('/dashboard/video')) return 'video';
    if (path.includes('/dashboard/claims')) return 'claims';
    return 'overview'; // Default tab
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  
  // Update the state when the URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location]);
  
  // Handle tab changes by navigating to the appropriate route
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${tab}`);
    }
  };

  // Render the appropriate content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'clients':
        return <ClientList />;
      case 'calendar':
        return <AppointmentCalendar />;
      case 'notes':
        return <SessionNotes />;
      case 'video':
        return <VideoConsultation />;
      case 'claims':
        return <InsuranceClaims />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <RootLayout>
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-64px)] w-full">
          <DashboardSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </RootLayout>
  );
};

export default Dashboard;
