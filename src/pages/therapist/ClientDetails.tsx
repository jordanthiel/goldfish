import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClientWithAppointments } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clients');
  const [clientTab, setClientTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [noteContent, setNoteContent] = useState("");
  const { toast } = useToast();
  
  // Handle sidebar tab changing
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // Fetch client data with appointments
  const {
    data: client,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientWithAppointments(id as string),
    enabled: !!id,
  });

  const handleSaveNote = () => {
    if (noteContent.trim() !== "") {
      // Here you would typically make an API call to save the note
      // For now, let's just show a toast message
      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully.",
      });
      setNoteContent(""); // Clear the textarea after saving
    } else {
      toast({
        title: "Error",
        description: "Note content cannot be empty.",
        variant: "destructive",
      });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-64px)] w-full">
            <DashboardSidebar activeTab="clients" setActiveTab={handleTabChange} />
            <main className="flex-1 p-6">
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple"></div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen">
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-64px)] w-full">
            <DashboardSidebar activeTab="clients" setActiveTab={handleTabChange} />
            <main className="flex-1 p-6">
              <div className="max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Client</h2>
                  <p className="text-red-600">{(error as Error)?.message || "Failed to load client data"}</p>
                  <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-64px)] w-full">
            <DashboardSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
            
            <main className="flex-1 p-6 overflow-auto">
              <div className="container max-w-5xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold">{client?.full_name}</h1>
                  <p className="text-gray-500">Client ID: {client?.id}</p>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList>
                    <TabsTrigger value="overview" onClick={() => setClientTab('overview')}>Overview</TabsTrigger>
                    <TabsTrigger value="appointments" onClick={() => setClientTab('appointments')}>Appointments</TabsTrigger>
                    <TabsTrigger value="notes" onClick={() => setClientTab('notes')}>Notes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
                        <p><strong>Email:</strong> {client?.email}</p>
                        <p><strong>Phone:</strong> {client?.phone}</p>
                        <p><strong>Address:</strong> {client?.address}</p>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Therapy Details</h2>
                        <p><strong>Therapist:</strong> Dr. Smith</p>
                        <p><strong>Session Type:</strong> Individual</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="appointments" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Upcoming Appointments</h2>
                        {client?.appointments && client.appointments.length > 0 ? (
                          <ul>
                            {client.appointments.map((appointment) => (
                              <li key={appointment.id} className="mb-2">
                                {appointment.date} - {appointment.time}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No upcoming appointments.</p>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold mb-2">Select Date</h2>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? (
                                <span>{selectedDate?.toLocaleDateString()}</span>
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              disabled={(date) =>
                                date > new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="notes" className="mt-4">
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Session Notes</h2>
                      <Textarea 
                        placeholder="Enter your session notes here..." 
                        className="w-full mb-4"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                      />
                      <Button onClick={handleSaveNote}>Save Note</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default ClientDetails;
