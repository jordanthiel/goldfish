
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider } from '@/components/ui/sidebar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import ClientList from '@/components/clients/ClientList';
import AppointmentCalendar from '@/components/calendar/AppointmentCalendar';
import SessionNotes from '@/components/notes/SessionNotes';
import VideoConsultation from '@/components/video/VideoConsultation';
import InsuranceClaims from '@/components/claims/InsuranceClaims';

// This will render the appropriate component based on the active tab
const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'overview':
      return <DashboardOverview />;
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
    case 'messages':
      return <div className="p-6"><h1 className="text-2xl font-bold">Messages</h1><p>Message center coming soon.</p></div>;
    case 'settings':
      return <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p>Settings page coming soon.</p></div>;
    default:
      return <DashboardOverview />;
  }
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const location = useLocation();
  
  useEffect(() => {
    // Extract tab from path
    const path = location.pathname;
    
    if (path === '/dashboard') {
      setActiveTab('overview');
      return;
    }
    
    const dashboardPrefix = '/dashboard/';
    if (path.startsWith(dashboardPrefix)) {
      const tabName = path.slice(dashboardPrefix.length);
      setActiveTab(tabName);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-64px)] w-full">
            <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-6xl mx-auto">
                <TabContent activeTab={activeTab} />
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
      
      <Separator />
      <Footer />
    </div>
  );
};

export default Dashboard;
