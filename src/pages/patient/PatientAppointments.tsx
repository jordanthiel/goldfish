import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import RootLayout from '@/components/layout/RootLayout';

// Demo appointments data
const appointmentsData = {
  upcoming: [
    {
      id: 1,
      date: addDays(new Date(), 5),
      startTime: "2:00 PM",
      endTime: "2:50 PM",
      type: "Video Session",
      therapist: "Dr. Amy Johnson",
      status: "Confirmed"
    },
    {
      id: 2,
      date: addDays(new Date(), 19),
      startTime: "2:00 PM",
      endTime: "2:50 PM",
      type: "Video Session",
      therapist: "Dr. Amy Johnson",
      status: "Confirmed"
    }
  ],
  past: [
    {
      id: 3,
      date: addDays(new Date(), -7),
      startTime: "2:00 PM",
      endTime: "2:50 PM",
      type: "Video Session",
      therapist: "Dr. Amy Johnson",
      status: "Completed"
    },
    {
      id: 4,
      date: addDays(new Date(), -21),
      startTime: "2:00 PM",
      endTime: "2:50 PM",
      type: "Video Session",
      therapist: "Dr. Amy Johnson",
      status: "Completed"
    },
    {
      id: 5,
      date: addDays(new Date(), -35),
      startTime: "1:00 PM",
      endTime: "1:50 PM",
      type: "Initial Consultation",
      therapist: "Dr. Amy Johnson",
      status: "Completed"
    }
  ]
};

// Combine all appointments for the calendar
const allAppointments = [...appointmentsData.upcoming, ...appointmentsData.past];

// Available appointment slots for booking
const availableSlots = [
  {
    id: 1,
    date: addDays(new Date(), 3),
    slots: [
      { time: "10:00 AM - 10:50 AM", available: true },
      { time: "11:00 AM - 11:50 AM", available: false },
      { time: "1:00 PM - 1:50 PM", available: true },
      { time: "2:00 PM - 2:50 PM", available: true },
      { time: "3:00 PM - 3:50 PM", available: false }
    ]
  },
  {
    id: 2,
    date: addDays(new Date(), 4),
    slots: [
      { time: "10:00 AM - 10:50 AM", available: false },
      { time: "11:00 AM - 11:50 AM", available: true },
      { time: "1:00 PM - 1:50 PM", available: false },
      { time: "2:00 PM - 2:50 PM", available: true },
      { time: "3:00 PM - 3:50 PM", available: true }
    ]
  },
  {
    id: 3,
    date: addDays(new Date(), 5),
    slots: [
      { time: "10:00 AM - 10:50 AM", available: true },
      { time: "11:00 AM - 11:50 AM", available: true },
      { time: "1:00 PM - 1:50 PM", available: true },
      { time: "2:00 PM - 2:50 PM", available: false },
      { time: "3:00 PM - 3:50 PM", available: true }
    ]
  }
];

const PatientAppointments = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookingTab, setBookingTab] = useState('calendar-view');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 3));
  const { toast } = useToast();
  
  // Function to handle booking an appointment
  const handleBookAppointment = (date: Date, timeSlot: string) => {
    console.log("Booking appointment for:", date, timeSlot);
    toast({
      title: "Appointment booked",
      description: `Your appointment has been scheduled for ${format(date, 'PPP')} at ${timeSlot}.`,
    });
  };

  // Function to handle cancelling an appointment
  const handleCancelAppointment = (appointmentId: number) => {
    console.log("Cancelling appointment:", appointmentId);
    toast({
      title: "Appointment cancelled",
      description: "Your appointment has been cancelled successfully.",
    });
  };

  // Function to handle rescheduling an appointment
  const handleRescheduleAppointment = (appointmentId: number) => {
    console.log("Rescheduling appointment:", appointmentId);
    setActiveTab('book');
    toast({
      title: "Select a new time",
      description: "Please select a new date and time for your appointment.",
    });
  };

  // Function to handle joining a session
  const handleJoinSession = (appointmentId: number) => {
    console.log("Joining session:", appointmentId);
    toast({
      title: "Joining session",
      description: "Connecting to your video session...",
    });
  };

  // Filter available slots based on the selected date
  const availableSlotsForSelectedDate = availableSlots.find(
    daySlot => selectedDate && isSameDay(daySlot.date, selectedDate)
  );

  return (
    <RootLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">
              View and manage your therapy appointments.
            </p>
          </div>
          
          <Separator />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="book">Book New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-6">
              {appointmentsData.upcoming.length > 0 ? (
                <div className="grid gap-4">
                  {appointmentsData.upcoming.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-therapy-light-purple flex items-center justify-center">
                              <CalendarIcon className="h-6 w-6 text-therapy-purple" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{appointment.type}</h3>
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800">
                                  {appointment.status}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {format(appointment.date, 'EEEE, MMMM d, yyyy')}
                              </p>
                              <p className="text-muted-foreground flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {appointment.startTime} - {appointment.endTime}
                              </p>
                              <p className="text-muted-foreground flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {appointment.therapist}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
                            <Button variant="outline" onClick={() => handleCancelAppointment(appointment.id)}>
                              Cancel
                            </Button>
                            <Button variant="outline" onClick={() => handleRescheduleAppointment(appointment.id)}>
                              Reschedule
                            </Button>
                            {new Date() >= new Date(appointment.date.setHours(new Date().getHours() - 1)) && (
                              <Button onClick={() => handleJoinSession(appointment.id)}>
                                <Video className="h-4 w-4 mr-2" />
                                Join Session
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No upcoming appointments</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any appointments scheduled yet.
                    </p>
                    <Button onClick={() => setActiveTab('book')}>Book an Appointment</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-6">
              {appointmentsData.past.length > 0 ? (
                <div className="grid gap-4">
                  {appointmentsData.past.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                              <Video className="h-6 w-6 text-therapy-pink" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{appointment.type}</h3>
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800">
                                  {appointment.status}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {format(appointment.date, 'EEEE, MMMM d, yyyy')}
                              </p>
                              <p className="text-muted-foreground flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {appointment.startTime} - {appointment.endTime}
                              </p>
                              <p className="text-muted-foreground flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {appointment.therapist}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2 md:mt-0">
                            <Button variant="outline">
                              View Session Notes
                            </Button>
                            <Button onClick={() => setActiveTab('book')}>
                              Book Similar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold text-lg mb-2">No past appointments</h3>
                    <p className="text-muted-foreground mb-4">
                      Once you've had sessions, they'll appear here.
                    </p>
                    <Button onClick={() => setActiveTab('book')}>Book Your First Appointment</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="book" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Book an Appointment</CardTitle>
                  <CardDescription>
                    Select a date and time for your next therapy session.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={bookingTab} onValueChange={setBookingTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="calendar-view">Calendar View</TabsTrigger>
                      <TabsTrigger value="list-view">List View</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="calendar-view" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border p-3"
                            disabled={(date) => 
                              date < new Date() || 
                              date > addDays(new Date(), 60)
                            }
                            modifiers={{
                              appointment: allAppointments.map(apt => new Date(apt.date))
                            }}
                            modifiersClassNames={{
                              appointment: "bg-therapy-purple text-white",
                            }}
                          />
                          <div className="mt-4 text-sm text-muted-foreground">
                            <p>• Purple dates indicate existing appointments</p>
                            <p>• Select a date to view available time slots</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-3">
                            {selectedDate ? `Available Times for ${format(selectedDate, 'EEEE, MMMM d, yyyy')}` : 'Select a date to view available times'}
                          </h3>
                          
                          {selectedDate && availableSlotsForSelectedDate ? (
                            <div className="space-y-2">
                              {availableSlotsForSelectedDate.slots.map((slot, index) => (
                                <Button
                                  key={index}
                                  variant={slot.available ? "outline" : "ghost"}
                                  className={`w-full justify-start text-left ${!slot.available && 'opacity-50 cursor-not-allowed'}`}
                                  onClick={() => slot.available && handleBookAppointment(selectedDate, slot.time)}
                                  disabled={!slot.available}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  {slot.time}
                                  {!slot.available && <span className="ml-2 text-muted-foreground">(Unavailable)</span>}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-md border p-6 text-center">
                              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                Please select a date to view available times.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="list-view" className="space-y-6">
                      <div className="space-y-4">
                        {availableSlots.map((daySlot) => (
                          <Card key={daySlot.id}>
                            <CardHeader className="pb-2">
                              <CardTitle>{format(daySlot.date, 'EEEE, MMMM d, yyyy')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {daySlot.slots.filter(s => s.available).map((slot, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => handleBookAppointment(daySlot.date, slot.time)}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    {slot.time}
                                  </Button>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    All sessions are 50 minutes with Dr. Amy Johnson
                  </p>
                  <p className="text-sm font-medium">
                    Session Fee: $150
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Separator />
      <Footer />
    </RootLayout>
  );
};

export default PatientAppointments;
