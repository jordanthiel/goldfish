
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-64px)] w-full">
            <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 p-6 overflow-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
                <TabsList className="hidden">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="claims">Claims</TabsTrigger>
                  <TabsTrigger value="video">Video</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-0">
                  <DashboardOverview />
                </TabsContent>
                
                <TabsContent value="clients" className="mt-0">
                  <ClientList />
                </TabsContent>
                
                <TabsContent value="calendar" className="mt-0">
                  <AppointmentCalendar />
                </TabsContent>
                
                <TabsContent value="notes" className="mt-0">
                  <SessionNotes />
                </TabsContent>
                
                <TabsContent value="claims" className="mt-0">
                  <InsuranceClaims />
                </TabsContent>
                
                <TabsContent value="video" className="mt-0">
                  <VideoConsultation />
                </TabsContent>
              </Tabs>
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
