
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
import { Button } from '@/components/ui/button';
import { backfillUserData } from '@/utils/backfillUserData';
import { useAuth } from '@/context/AuthContext';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth(); // Use userRole from the fixed AuthContext
  const [isBackfilling, setIsBackfilling] = useState(false);
  
  useEffect(() => {
    console.log("Dashboard - Current user role:", userRole);
    
    if (userRole === 'client') {
      console.log("Dashboard - Redirecting client to patient dashboard");
      navigate('/patient/dashboard');
    }
  }, [userRole, navigate]);
  
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
  
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${tab}`);
    }
  };

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      await backfillUserData();
      if (userRole === 'client') {
        navigate('/patient/dashboard');
      }
    } finally {
      setIsBackfilling(false);
    }
  };

  if (userRole === 'client') {
    console.log("Dashboard - Client user, returning null");
    return null;
  }

  // Move renderContent inside the component to access component variables
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
        return (
          <>
            <DashboardOverview />
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="text-lg font-medium mb-2">Development Tools</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use this button to add test data to your account for testing purposes.
              </p>
              <Button 
                onClick={handleBackfill} 
                disabled={isBackfilling}
                variant="outline"
              >
                {isBackfilling ? 'Adding test data...' : 'Backfill Test Data For My Account'}
              </Button>
            </div>
          </>
        );
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
