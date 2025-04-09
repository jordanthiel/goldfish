
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarDay } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Appointment, patientService } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertCircle, Video, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Temporary stub implementation until this is implemented properly
const PatientAppointments = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        // Using the existing dashboard data function to get appointments
        const data = await patientService.getPatientDashboardData();
        // Combine upcoming and recent appointments
        const allAppointments = [
          ...data.upcomingAppointments,
          ...data.recentAppointments
        ];
        setAppointments(allAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error loading appointments",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user, toast]);

  if (isLoading) {
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
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Appointments</h1>
            <p className="text-muted-foreground">
              View and manage your therapy sessions
            </p>
          </div>
          
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past Sessions</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4">
              {appointments.filter(apt => new Date(apt.start_time) > new Date()).length > 0 ? (
                appointments
                  .filter(apt => new Date(apt.start_time) > new Date())
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map(appointment => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-therapy-light-purple flex items-center justify-center">
                            <Video className="h-6 w-6 text-therapy-purple" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-lg">{appointment.title || 'Therapy Session'}</h3>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(new Date(appointment.start_time), 'h:mm a')} - 
                                    {format(new Date(appointment.end_time), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={
                                appointment.status === 'Scheduled' ? 'outline' :
                                appointment.status === 'Completed' ? 'secondary' :
                                appointment.status === 'Cancelled' ? 'destructive' : 'default'
                              }>
                                {appointment.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center py-10 flex flex-col items-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No upcoming appointments</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any scheduled appointments yet.
                    </p>
                    <Button>Schedule a Session</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-4">
              {appointments.filter(apt => new Date(apt.start_time) <= new Date()).length > 0 ? (
                appointments
                  .filter(apt => new Date(apt.start_time) <= new Date())
                  .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                  .map(appointment => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                            <Video className="h-6 w-6 text-therapy-pink" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-lg">{appointment.title || 'Therapy Session'}</h3>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>{format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(new Date(appointment.start_time), 'h:mm a')} - 
                                    {format(new Date(appointment.end_time), 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={
                                appointment.status === 'Scheduled' ? 'outline' :
                                appointment.status === 'Completed' ? 'secondary' :
                                appointment.status === 'Cancelled' ? 'destructive' : 'default'
                              }>
                                {appointment.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center py-10 flex flex-col items-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No past appointments</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't had any therapy sessions yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Calendar</CardTitle>
                  <CardDescription>
                    View all your scheduled appointments on a calendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar 
                    mode="single"
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
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
