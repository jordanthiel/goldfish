
import React from 'react';
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
} from 'lucide-react';
import { format } from 'date-fns';

// Demo patient data
const patientData = {
  name: "Michael Davis",
  therapistName: "Dr. Amy Johnson",
  nextAppointment: new Date("2023-10-10T14:00:00"),
  upcomingAppointments: [
    {
      id: 1,
      date: new Date("2023-10-10T14:00:00"),
      duration: 50,
      type: "Video Session"
    },
    {
      id: 2,
      date: new Date("2023-10-24T14:00:00"),
      duration: 50,
      type: "Video Session"
    }
  ],
  recentAppointments: [
    {
      id: 3,
      date: new Date("2023-09-26T14:00:00"),
      duration: 50,
      type: "Video Session",
      notes: "We discussed stress management techniques and set goals for the upcoming week."
    }
  ],
  unreadMessages: 2
};

const PatientDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {patientData.name}</h1>
              <p className="text-muted-foreground">
                Here's an overview of your therapy journey and upcoming appointments.
              </p>
            </div>
            
            {patientData.nextAppointment && (
              <div className="rounded-lg bg-white p-4 border shadow-sm">
                <p className="text-sm font-medium text-muted-foreground mb-1">Your next appointment</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-therapy-purple" />
                  </div>
                  <div>
                    <p className="font-semibold">{format(patientData.nextAppointment, 'PPP')}</p>
                    <p className="text-sm">{format(patientData.nextAppointment, 'h:mm a')} with {patientData.therapistName}</p>
                  </div>
                  <Button variant="default" size="sm" className="ml-2">
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
                {patientData.upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {patientData.upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start gap-3 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-therapy-purple" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div>
                              <p className="font-semibold">{format(appointment.date, 'EEEE, MMMM d, yyyy')}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(appointment.date, 'h:mm a')} • {appointment.duration} minutes • {appointment.type}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Reschedule</Button>
                              <Button variant="default" size="sm">
                                {new Date() >= appointment.date ? 'Join Now' : 'Add to Calendar'}
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
                <Button variant="outline" className="w-full">
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
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-therapy-purple text-white text-xl">AJ</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{patientData.therapistName}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Licensed Clinical Psychologist</p>
                  
                  <div className="grid grid-cols-2 gap-2 w-full mt-2">
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button className="w-full">
                      <Video className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
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
                {patientData.recentAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {patientData.recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-4 bg-muted/30">
                          <div className="w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                            <Video className="h-5 w-5 text-therapy-pink" />
                          </div>
                          <div>
                            <p className="font-semibold">{format(appointment.date, 'EEEE, MMMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(appointment.date, 'h:mm a')} • {appointment.duration} minutes • {appointment.type}
                            </p>
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="p-4 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Session Notes:</p>
                            <p>{appointment.notes}</p>
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
                <Button variant="outline" className="w-full">
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
                      <p className="text-3xl font-bold">{patientData.recentAppointments.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-therapy-light-purple flex items-center justify-center">
                      <FileText className="h-6 w-6 text-therapy-purple" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
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
                    <Button variant="outline" className="w-full">
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
