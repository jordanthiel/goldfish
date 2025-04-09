
import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar as CalendarIcon, Clock, Video } from "lucide-react";
import { format } from "date-fns";
import { useToast } from '@/hooks/use-toast';
import { PatientLayout } from '../layout/PatientLayout';
import { patientService, Appointment } from '@/services/patientService';
import { Skeleton } from '@/components/ui/skeleton';

const PatientAppointments = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const patientData = await patientService.getPatientProfile();
        if (!patientData) {
          toast({
            title: "Error loading profile",
            description: "Could not load your patient profile",
            variant: "destructive",
          });
          return;
        }
        
        const dashboardData = await patientService.getPatientDashboardData();
        setAppointments([
          ...dashboardData.upcomingAppointments,
          ...dashboardData.recentAppointments
        ]);
      } catch (error) {
        console.error("Error loading appointments:", error);
        toast({
          title: "Error",
          description: "Could not load your appointments",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [toast]);

  // Filter appointments for the selected date
  const appointmentsOnSelectedDate = selectedDate
    ? appointments.filter(apt => {
        const aptDate = new Date(apt.start_time);
        return (
          aptDate.getDate() === selectedDate.getDate() &&
          aptDate.getMonth() === selectedDate.getMonth() &&
          aptDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  // Get all dates that have appointments for highlighting in the calendar
  const appointmentDates = appointments.map(apt => {
    const date = new Date(apt.start_time);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });

  return (
    <PatientLayout>
      <div className="space-y-6 p-6 pb-16">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">View and manage your therapy sessions</p>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>Select a date to view appointments</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={loading}
                    modifiers={{
                      booked: appointmentDates,
                    }}
                    modifiersStyles={{
                      booked: { 
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                      }
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="col-span-1 md:col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? (
                      `Appointments for ${format(selectedDate, 'PPP')}`
                    ) : (
                      'Select a date to view appointments'
                    )}
                  </CardTitle>
                  <CardDescription>
                    {appointmentsOnSelectedDate.length} 
                    {appointmentsOnSelectedDate.length === 1 ? ' session' : ' sessions'} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : appointmentsOnSelectedDate.length > 0 ? (
                    <div className="space-y-4">
                      {appointmentsOnSelectedDate.map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No appointments on this date</h3>
                      <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                        There are no therapy sessions scheduled for the selected date.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>View all your scheduled therapy sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments
                      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                      .map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No appointments found</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                      You don't have any therapy sessions scheduled yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>View your upcoming therapy sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : appointments.filter(a => new Date(a.start_time) > new Date()).length > 0 ? (
                  <div className="space-y-4">
                    {appointments
                      .filter(a => new Date(a.start_time) > new Date())
                      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                      .map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No upcoming appointments</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                      You don't have any upcoming therapy sessions scheduled.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Past Appointments</CardTitle>
                <CardDescription>View your past therapy sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : appointments.filter(a => new Date(a.start_time) <= new Date()).length > 0 ? (
                  <div className="space-y-4">
                    {appointments
                      .filter(a => new Date(a.start_time) <= new Date())
                      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                      .map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No past appointments</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1 mb-4">
                      You haven't had any therapy sessions yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PatientLayout>
  );
};

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
  const isPast = new Date(appointment.end_time) < new Date();
  const isOngoing = new Date(appointment.start_time) <= new Date() && new Date(appointment.end_time) >= new Date();
  
  return (
    <div className={`rounded-lg border p-4 ${isOngoing ? 'border-purple-500 bg-purple-50' : ''}`}>
      <div className="flex flex-col sm:flex-row justify-between">
        <div>
          <h3 className="font-medium text-lg">{appointment.title}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <CalendarIcon className="mr-1 h-4 w-4" />
            <span>{format(new Date(appointment.start_time), 'PPP')}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Clock className="mr-1 h-4 w-4" />
            <span>
              {format(new Date(appointment.start_time), 'h:mm a')} - 
              {format(new Date(appointment.end_time), 'h:mm a')}
              {appointment.duration && ` (${appointment.duration} min)`}
            </span>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              ${appointment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                isOngoing ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'}`
            }>
              {isOngoing ? 'In Progress' : appointment.status}
            </span>
          </div>
        </div>
        <div className="mt-3 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end gap-2">
          {!isPast && (
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Join</span>
            </Button>
          )}
          {isPast && appointment.status === 'Completed' && (
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              View Notes <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointments;
