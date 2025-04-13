import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Video,
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
  BookOpen,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { patientService } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const PatientDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    therapist: null,
    upcomingAppointments: [],
    recentAppointments: []
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching patient dashboard data for user:", user?.email);
        const data = await patientService.getPatientDashboardData(user?.id);
        console.log("Dashboard data received:", data);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load your dashboard data');
        toast({
          title: "Error loading dashboard data",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      console.log("No user logged in, waiting for auth");
    }
  }, [toast, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-therapy-purple" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </main>
        <Separator />
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-lg text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <h2 className="text-xl font-semibold">Oops! Something went wrong</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </main>
        <Separator />
        <Footer />
      </div>
    );
  }

  if (!dashboardData.therapist && dashboardData.upcomingAppointments.length === 0 && dashboardData.recentAppointments.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to your therapy dashboard</h1>
              <p className="text-muted-foreground">
                Looks like you're getting started! You currently don't have a therapist assigned.
              </p>
              {user && (
                <div className="mt-2 p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-600">Your email: {user.email}</p>
                  <p className="text-sm text-blue-600">User ID: {user.id}</p>
                  <p className="text-sm text-blue-600">
                    If you were expecting to see your therapist, please ask them to add you as a client.
                  </p>
                </div>
              )}
            </div>
            
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-therapy-light-purple flex items-center justify-center">
                  <CalendarIcon className="h-8 w-8 text-therapy-purple" />
                </div>
                <h2 className="text-xl font-semibold">No therapist assigned yet</h2>
                <p className="text-muted-foreground">
                  Once you're matched with a therapist, you'll see your appointment schedule 
                  and therapy information here.
                </p>
                <Button className="mt-4">Browse Therapists</Button>
              </div>
            </Card>
          </div>
        </main>
        <Separator />
        <Footer />
      </div>
    );
  }

  const { therapist, upcomingAppointments, recentAppointments } = dashboardData;
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  console.log('dashboardData', dashboardData.upcomingAppointments);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground">
                Here's an overview of your therapy journey and upcoming appointments.
              </p>
            </div>
            
            {dashboardData.upcomingAppointments.length > 0 && (
              <div className="rounded-lg bg-white p-4 border shadow-sm">
                <p className="text-sm font-medium text-muted-foreground mb-1">Your next appointment</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-therapy-purple" />
                  </div>
                  <div>
                    <p className="font-semibold">{format(new Date(dashboardData.upcomingAppointments[0].start_time), 'PPP')}</p>
                    <p className="text-sm">
                      {format(new Date(dashboardData.upcomingAppointments[0].start_time), 'h:mm a')} 
                      {dashboardData.therapist && ` with ${dashboardData.therapist.full_name || 'Your Therapist'}`}
                    </p>
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => navigate(`/patient/appointments/${dashboardData.upcomingAppointments[0].id}`)}
                  >
                    Join
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  Your scheduled therapy sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start gap-3 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-therapy-purple" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div>
                              <p className="font-semibold">{format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy')}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(appointment.start_time), 'h:mm a')} • {Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60))} minutes • {appointment.type}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Reschedule</Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  const now = new Date();
                                  const appointmentStart = new Date(appointment.start_time);
                                  const diffMinutes = Math.round((appointmentStart.getTime() - now.getTime()) / (1000 * 60));
                                  
                                  if (diffMinutes <= 10 && diffMinutes >= -30) {
                                    navigate(`/patient/appointments/${appointment.id}`);
                                  } else {
                                    // Add to calendar logic would go here
                                    toast({
                                      title: "Added to calendar",
                                      description: "The appointment has been added to your calendar"
                                    });
                                  }
                                }}
                              >
                                {new Date() >= new Date(appointment.start_time) ? 'Join Now' : 'Add to Calendar'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No upcoming appointments</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any appointments scheduled yet.
                    </p>
                    <Button>Book an Appointment</Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/patient/appointments')}
                >
                  View All Appointments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Therapist</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.therapist ? (
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={dashboardData.therapist.profile_image_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-therapy-purple text-white text-xl">
                        {dashboardData.therapist.full_name ? dashboardData.therapist.full_name.split(' ').map(n => n[0]).join('') : "T"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{dashboardData.therapist.full_name || "Your Therapist"}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{dashboardData.therapist.specialty || "Licensed Clinical Psychologist"}</p>
                    
                    <div className="grid grid-cols-2 gap-2 w-full mt-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/patient/messages')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          const nextAppointment = dashboardData.upcomingAppointments.length > 0 ? dashboardData.upcomingAppointments[0] : null;
                          if (nextAppointment) {
                            navigate(`/patient/appointments/${nextAppointment.id}`);
                          } else {
                            toast({
                              title: "No upcoming appointments",
                              description: "Please schedule an appointment first"
                            });
                          }
                        }}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-4">
                    <p className="text-muted-foreground">No therapist assigned yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>
                  Your recent therapy sessions and notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-4 bg-muted/30">
                          <div className="w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                            <Video className="h-5 w-5 text-therapy-pink" />
                          </div>
                          <div>
                            <p className="font-semibold">{format(new Date(appointment.start_time), 'EEEE, MMMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(appointment.start_time), 'h:mm a')} • {appointment.duration} minutes • {appointment.type}
                            </p>
                          </div>
                        </div>
                        {(appointment.notes || (appointment.session_notes && appointment.session_notes.length > 0)) && (
                          <div className="p-4 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Session Notes:</p>
                            <p>
                              {appointment.notes || 
                               (appointment.session_notes && appointment.session_notes.length > 0 
                                ? appointment.session_notes[0].content 
                                : "No notes available.")}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No past sessions</h3>
                    <p className="text-muted-foreground">
                      Once you've had your first session, you'll see notes and records here.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/patient/appointments')}
                >
                  View All Sessions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-therapy-purple" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-medium">Sessions completed</p>
                      <p className="text-3xl font-bold">{recentAppointments.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-therapy-light-purple flex items-center justify-center">
                      <FileText className="h-6 w-6 text-therapy-purple" />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/patient/appointments')}
                  >
                    View Therapy Journey
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-therapy-purple" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Recommended materials from your therapist
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/patient/resources')}
                    >
                      View Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Separator />
      <Footer />
    </div>
  );
};

export default PatientDashboard;
