
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Send, 
  FileText, 
  Video, 
  MessageSquare, 
  Plus, 
  Edit, 
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { clientService, Client } from '@/services/clientService';
import { useQuery } from '@tanstack/react-query';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('clients');
  const [clientTab, setClientTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [noteContent, setNoteContent] = useState("");
  const { toast } = useToast();
  
  // Fetch client data with appointments
  const {
    data: clientData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => id ? clientService.getClientWithAppointments(id) : Promise.reject('No client ID provided'),
    enabled: !!id
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading client data",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleSaveNote = () => {
    if (noteContent.trim().length === 0) {
      toast({
        title: "Error",
        description: "Note content cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Saving note:", noteContent);
    toast({
      title: "Note saved",
      description: "Your note has been saved successfully."
    });
    setNoteContent("");
  };

  const handleScheduleAppointment = () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date for the appointment.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Scheduling appointment for:", selectedDate);
    toast({
      title: "Appointment scheduled",
      description: `Appointment scheduled for ${format(selectedDate, 'PPP')} at 3:00 PM.`
    });
  };

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-therapy-purple mb-4" />
            <p className="text-muted-foreground">Loading client data...</p>
          </div>
        </div>
        <Separator />
        <Footer />
      </div>
    );
  }

  // If no client data found, show error message
  if (!clientData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-md p-6">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The client you're looking for couldn't be found or you don't have permission to view this client.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
        <Separator />
        <Footer />
      </div>
    );
  }

  // Format client data for display
  const clientName = `${clientData.first_name} ${clientData.last_name}`;
  const clientInitials = `${clientData.first_name[0]}${clientData.last_name[0]}`.toUpperCase();
  
  // Sort appointments by date - upcoming first
  const sortedAppointments = [...(clientData.appointments || [])].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  // Find next upcoming appointment
  const nextAppointment = sortedAppointments.find(apt => 
    new Date(apt.start_time) > new Date()
  );
  
  // Find most recent past appointment
  const pastAppointments = sortedAppointments.filter(apt => 
    new Date(apt.end_time) < new Date()
  ).sort((a, b) => 
    new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
  );
  
  const lastAppointment = pastAppointments[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1">
        <SidebarProvider>
          <div className="flex min-h-[calc(100vh-64px)] w-full">
            <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 p-6 overflow-auto">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{clientName}</h1>
                    <p className="text-muted-foreground">
                      Client ID: {clientData.id} • Added on {new Date(clientData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client
                    </Button>
                    <Button>
                      <Video className="h-4 w-4 mr-2" />
                      Start Session
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-3 gap-6">
                  <Card className="col-span-3 md:col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle>Client Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center mb-6">
                        <Avatar className="h-24 w-24 mb-4">
                          <AvatarImage src={undefined} alt={clientName} />
                          <AvatarFallback className="bg-therapy-purple text-white text-xl">{clientInitials}</AvatarFallback>
                        </Avatar>
                        <Badge className={`mb-2 ${
                          clientData.status === 'Active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800'
                        }`}>
                          {clientData.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p>{clientData.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p>{clientData.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                          <p>{clientData.date_of_birth || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Address</p>
                          <p>{clientData.address || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                          <p>{clientData.emergency_contact || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Next Appointment</p>
                          {nextAppointment ? (
                            <p className="flex items-center text-therapy-purple">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {format(new Date(nextAppointment.start_time), 'PPP')} at{' '}
                              {format(new Date(nextAppointment.start_time), 'h:mm a')}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">No upcoming appointments</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="col-span-3 md:col-span-2">
                    <Tabs value={clientTab} onValueChange={setClientTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="appointments">Appointments</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Clock className="h-5 w-5 mr-2 text-therapy-purple" />
                              Recent Activity
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {sortedAppointments.length > 0 ? (
                              <div className="space-y-4">
                                {nextAppointment && (
                                  <div className="flex items-start gap-4 pb-4 border-b">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                                      <CalendarIcon className="h-5 w-5 text-therapy-purple" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold">Upcoming Session</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Scheduled session with {clientName}.
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(nextAppointment.start_time), 'PPP • h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {lastAppointment && (
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                                      <Video className="h-5 w-5 text-therapy-pink" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold">Session Completed</h4>
                                      <p className="text-sm text-muted-foreground">
                                        You completed a session with {clientName}.
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(lastAppointment.end_time), 'PPP • h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-semibold text-lg mb-2">No activity yet</h3>
                                <p className="text-muted-foreground mb-4">
                                  There are no sessions scheduled or completed with this client.
                                </p>
                                <Button>
                                  <CalendarIcon className="h-4 w-4 mr-2" />
                                  Schedule First Session
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                          {/* Latest Note section - we'll add this once notes are implemented */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-therapy-purple" />
                                Latest Note
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-4">
                                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No notes yet for this client</p>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button variant="outline" className="w-full" onClick={() => setClientTab('notes')}>
                                Add First Note
                              </Button>
                            </CardFooter>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center">
                                <CalendarIcon className="h-5 w-5 mr-2 text-therapy-purple" />
                                Next Appointment
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {nextAppointment ? (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <p className="font-semibold">{nextAppointment.title}</p>
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800">
                                      {nextAppointment.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="flex items-center">
                                      <CalendarIcon className="h-4 w-4 mr-1" />
                                      {format(new Date(nextAppointment.start_time), 'PPP')}
                                    </span>
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {format(new Date(nextAppointment.start_time), 'h:mm a')} - {format(new Date(nextAppointment.end_time), 'h:mm a')}
                                    </span>
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-muted-foreground">No upcoming appointments</p>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter>
                              <Button variant="outline" className="w-full" onClick={() => setClientTab('appointments')}>
                                {nextAppointment ? 'View All Appointments' : 'Schedule Appointment'}
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-therapy-purple" />
                              Add Quick Note
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              placeholder="Type a quick note about this client..."
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                              rows={4}
                              className="resize-none"
                            />
                          </CardContent>
                          <CardFooter className="flex justify-end">
                            <Button onClick={handleSaveNote}>
                              Save Note
                            </Button>
                          </CardFooter>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="notes" className="space-y-6">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                              <CardTitle>Session Notes</CardTitle>
                              <CardDescription>View and manage your notes for this client.</CardDescription>
                            </div>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Note
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-10">
                              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <h3 className="font-semibold text-lg mb-2">No notes yet</h3>
                              <p className="text-muted-foreground mb-4">
                                You haven't created any notes for this client yet.
                              </p>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Note
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="appointments" className="space-y-6">
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle>Appointment History</CardTitle>
                              <CardDescription>Past and upcoming appointments.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {clientData.appointments && clientData.appointments.length > 0 ? (
                                <div className="space-y-4">
                                  {sortedAppointments.map((appointment) => {
                                    const isCompleted = new Date(appointment.end_time) < new Date();
                                    return (
                                      <div key={appointment.id} className="flex justify-between items-center p-3 border rounded-lg">
                                        <div>
                                          <p className="font-semibold">{appointment.title}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {format(new Date(appointment.start_time), 'PPP')} • {format(new Date(appointment.start_time), 'h:mm a')} - {format(new Date(appointment.end_time), 'h:mm a')}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant="outline" 
                                            className={
                                              isCompleted 
                                                ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" 
                                                : "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800"
                                            }
                                          >
                                            {isCompleted ? "Completed" : appointment.status}
                                          </Badge>
                                          
                                          <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => navigate(`/therapist/session/${appointment.id}`)}
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <p className="text-muted-foreground">No appointments scheduled yet</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle>Schedule New Appointment</CardTitle>
                              <CardDescription>Select a date for the next session.</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-col">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  className="rounded-md border p-3 mb-4 mx-auto"
                                />
                                <Button onClick={handleScheduleAppointment}>
                                  <CalendarIcon className="h-4 w-4 mr-2" />
                                  Schedule Appointment
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="messages" className="space-y-6">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                              <CardTitle>Messages</CardTitle>
                              <CardDescription>Your message history with this client.</CardDescription>
                            </div>
                            <Button>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </Button>
                          </CardHeader>
                          <CardContent className="h-96 flex items-center justify-center">
                            <div className="text-center">
                              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
                              <p className="text-muted-foreground mb-4">
                                Start a conversation with {clientName} to send appointment reminders or check-ins.
                              </p>
                              <Button>
                                <Send className="h-4 w-4 mr-2" />
                                Start Conversation
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
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

export default ClientDetails;
