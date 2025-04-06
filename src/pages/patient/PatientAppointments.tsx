
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2,
  Search,
  FileText,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { patientService, PatientAppointment } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      try {
        const data = await patientService.getPatientAppointments();
        setAppointments(data);
      } catch (error) {
        console.error('Error loading appointments:', error);
        toast({
          title: "Failed to load appointments",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [toast]);

  const now = new Date();
  
  const upcomingAppointments = appointments
    .filter(app => new Date(app.start_time) > now)
    .filter(app => 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.type?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  
  const pastAppointments = appointments
    .filter(app => new Date(app.end_time) < now)
    .filter(app => 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.type?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const toggleExpand = (id: string) => {
    setExpandedAppointment(expandedAppointment === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-therapy-purple" />
            <p className="text-muted-foreground">Loading your appointments...</p>
          </div>
        </main>
        <Separator />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Appointments</h1>
            <p className="text-muted-foreground">
              Manage your therapy sessions and appointment history
            </p>
          </div>
          
          <Separator className="my-6" />
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search appointments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-6">
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id} className="overflow-hidden">
                      <div onClick={() => toggleExpand(appointment.id)} className="cursor-pointer">
                        <CardHeader className="py-4 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                              <CalendarIcon className="h-5 w-5 text-therapy-purple" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{appointment.title}</CardTitle>
                              <CardDescription>
                                {format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy • h:mm a')}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mr-3">
                              {appointment.status}
                            </Badge>
                            {expandedAppointment === appointment.id ? 
                              <ChevronDown className="h-5 w-5" /> : 
                              <ChevronRight className="h-5 w-5" />
                            }
                          </div>
                        </CardHeader>
                      </div>
                      
                      {expandedAppointment === appointment.id && (
                        <CardContent className="pb-4">
                          <div className="border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Duration:</span>
                                <span className="text-sm font-medium">{appointment.duration} minutes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Type:</span>
                                <span className="text-sm font-medium">{appointment.type}</span>
                              </div>
                            </div>
                            
                            {appointment.notes && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-1">Session Notes:</h4>
                                <p className="text-sm">{appointment.notes}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-4">
                              <Button size="sm">Join Session</Button>
                              <Button size="sm" variant="outline">Reschedule</Button>
                              <Button size="sm" variant="outline">Cancel</Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No upcoming appointments</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any appointments scheduled for the future.
                  </p>
                  <Button>Schedule an Appointment</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-6">
              {pastAppointments.length > 0 ? (
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="overflow-hidden">
                      <div onClick={() => toggleExpand(appointment.id)} className="cursor-pointer">
                        <CardHeader className="py-4 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-therapy-pink" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{appointment.title}</CardTitle>
                              <CardDescription>
                                {format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy • h:mm a')}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-3">
                              Completed
                            </Badge>
                            {expandedAppointment === appointment.id ? 
                              <ChevronDown className="h-5 w-5" /> : 
                              <ChevronRight className="h-5 w-5" />
                            }
                          </div>
                        </CardHeader>
                      </div>
                      
                      {expandedAppointment === appointment.id && (
                        <CardContent className="pb-4">
                          <div className="border-t pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Duration:</span>
                                <span className="text-sm font-medium">{appointment.duration} minutes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Type:</span>
                                <span className="text-sm font-medium">{appointment.type}</span>
                              </div>
                            </div>
                            
                            {appointment.notes && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-1">Session Notes:</h4>
                                <p className="text-sm">{appointment.notes}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-4">
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                View Detailed Notes
                              </Button>
                              <Button size="sm" variant="outline">Book Follow-up</Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No past appointments</h3>
                  <p className="text-muted-foreground mb-4">
                    Once you've completed appointments, they'll appear here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Separator />
      <Footer />
    </div>
  );
};

export default PatientAppointments;
