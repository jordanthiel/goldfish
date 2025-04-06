import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

const clientData = {
  id: "123",
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  phone: "(555) 987-6543",
  dateOfBirth: "1985-09-15",
  address: "456 Elm Street, Los Angeles, CA 90001",
  dateAdded: "2023-02-10",
  status: "Active",
  nextAppointment: "2023-10-05T15:00:00",
  photo: null,
  notes: [
    {
      id: 1,
      date: "2023-09-15",
      content: "Sarah reported improved sleep patterns after implementing the mindfulness techniques we discussed in our previous session. She's still experiencing some work-related anxiety but says it's more manageable now.",
      tags: ["anxiety", "progress", "mindfulness"]
    },
    {
      id: 2,
      date: "2023-09-08",
      content: "Initial assessment: Sarah is experiencing symptoms of anxiety and insomnia related to work stress. She reports difficulty falling asleep and constant worry about deadlines. We discussed potential mindfulness techniques to help manage stress.",
      tags: ["initial", "anxiety", "insomnia"]
    }
  ],
  appointments: [
    {
      id: 1,
      date: "2023-09-15",
      time: "3:00 PM - 4:00 PM",
      status: "Completed",
      type: "Video Session"
    },
    {
      id: 2,
      date: "2023-09-08",
      time: "3:00 PM - 4:00 PM",
      status: "Completed",
      type: "Initial Consultation"
    },
    {
      id: 3,
      date: "2023-10-05",
      time: "3:00 PM - 4:00 PM",
      status: "Scheduled",
      type: "Video Session"
    }
  ]
};

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('clients');
  const [clientTab, setClientTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [noteContent, setNoteContent] = useState("");
  const { toast } = useToast();
  
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
                    <h1 className="text-3xl font-bold tracking-tight">{clientData.name}</h1>
                    <p className="text-muted-foreground">
                      Client ID: {clientData.id} • Added on {clientData.dateAdded}
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
                          <AvatarImage src={clientData.photo || undefined} alt={clientData.name} />
                          <AvatarFallback className="bg-therapy-purple text-white text-xl">SJ</AvatarFallback>
                        </Avatar>
                        <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800">
                          {clientData.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p>{clientData.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p>{clientData.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                          <p>{clientData.dateOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Address</p>
                          <p>{clientData.address}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Next Appointment</p>
                          <p className="flex items-center text-therapy-purple">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {format(new Date(clientData.nextAppointment), 'PPP')} at 3:00 PM
                          </p>
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
                            <div className="space-y-4">
                              <div className="flex items-start gap-4 pb-4 border-b">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-therapy-purple" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Session Note Added</h4>
                                  <p className="text-sm text-muted-foreground">
                                    You added a new session note for Sarah Johnson.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">September 15, 2023 • 4:30 PM</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-4 pb-4 border-b">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                                  <Video className="h-5 w-5 text-therapy-pink" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Video Session Completed</h4>
                                  <p className="text-sm text-muted-foreground">
                                    You completed a 60-minute video session with Sarah Johnson.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">September 15, 2023 • 4:00 PM</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                                  <CalendarIcon className="h-5 w-5 text-therapy-purple" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">Appointment Scheduled</h4>
                                  <p className="text-sm text-muted-foreground">
                                    You scheduled a new appointment with Sarah Johnson.
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">September 14, 2023 • 10:15 AM</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-therapy-purple" />
                                Latest Note
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {clientData.notes[0].date}
                                </p>
                                <p>
                                  {clientData.notes[0].content.length > 150
                                    ? `${clientData.notes[0].content.substring(0, 150)}...`
                                    : clientData.notes[0].content}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {clientData.notes[0].tags.map((tag, index) => (
                                    <Badge key={index} variant="outline">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button variant="outline" className="w-full" onClick={() => setClientTab('notes')}>
                                View All Notes
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
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="font-semibold">{clientData.appointments[2].type}</p>
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800">
                                    {clientData.appointments[2].status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    {clientData.appointments[2].date}
                                  </span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {clientData.appointments[2].time}
                                  </span>
                                </p>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button variant="outline" className="w-full" onClick={() => setClientTab('appointments')}>
                                View All Appointments
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
                            <div className="space-y-6">
                              {clientData.notes.map((note) => (
                                <div key={note.id} className="border rounded-lg p-4 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <p className="font-semibold">{note.date}</p>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p>{note.content}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {note.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
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
                              <div className="space-y-4">
                                {clientData.appointments.map((appointment) => (
                                  <div key={appointment.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                      <p className="font-semibold">{appointment.type}</p>
                                      <p className="text-sm text-muted-foreground">{appointment.date} • {appointment.time}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          appointment.status === "Completed" 
                                            ? "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800" 
                                            : "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800"
                                        }
                                      >
                                        {appointment.status}
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
                                ))}
                              </div>
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
                                Start a conversation with Sarah to send appointment reminders or check-ins.
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
