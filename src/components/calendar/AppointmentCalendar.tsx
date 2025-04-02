
import React, { useState } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, parse, isSameDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

// Mock appointment data
const appointments = [
  {
    id: 1,
    title: 'Initial Consultation',
    clientName: 'John Doe',
    date: new Date(2023, 4, 15, 9, 0), // May 15, 2023, 9:00 AM
    duration: 60, // minutes
    type: 'In-Person'
  },
  {
    id: 2,
    title: 'Therapy Session',
    clientName: 'Sarah Johnson',
    date: new Date(2023, 4, 15, 11, 0), // May 15, 2023, 11:00 AM
    duration: 50, // minutes
    type: 'Video Call'
  },
  {
    id: 3,
    title: 'Follow-up Session',
    clientName: 'Michael Chen',
    date: new Date(2023, 4, 15, 14, 0), // May 15, 2023, 2:00 PM
    duration: 45, // minutes
    type: 'In-Person'
  },
  {
    id: 4,
    title: 'Group Therapy',
    clientName: 'Anxiety Support Group',
    date: new Date(2023, 4, 16, 10, 0), // May 16, 2023, 10:00 AM
    duration: 90, // minutes
    type: 'In-Person'
  },
  {
    id: 5,
    title: 'Therapy Session',
    clientName: 'Jessica Taylor',
    date: new Date(2023, 4, 16, 13, 0), // May 16, 2023, 1:00 PM
    duration: 50, // minutes
    type: 'Video Call'
  },
  {
    id: 6,
    title: 'Initial Consultation',
    clientName: 'David Wilson',
    date: new Date(2023, 4, 17, 15, 0), // May 17, 2023, 3:00 PM
    duration: 60, // minutes
    type: 'In-Person'
  },
];

// Working hours
const workingHours = [
  {
    day: 'Monday',
    hours: '9:00 AM - 5:00 PM'
  },
  {
    day: 'Tuesday',
    hours: '9:00 AM - 5:00 PM'
  },
  {
    day: 'Wednesday',
    hours: '9:00 AM - 5:00 PM'
  },
  {
    day: 'Thursday',
    hours: '9:00 AM - 5:00 PM'
  },
  {
    day: 'Friday',
    hours: '9:00 AM - 5:00 PM'
  },
  {
    day: 'Saturday',
    hours: 'Closed'
  },
  {
    day: 'Sunday',
    hours: 'Closed'
  }
];

// Time slots for the day view
const timeSlots = Array.from({ length: 9 }, (_, i) => {
  const hour = i + 9; // Start from 9 AM
  return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
});

// Function to get appointments for a specific day
const getAppointmentsForDay = (day: Date) => {
  return appointments.filter(appointment => isSameDay(appointment.date, day));
};

const AppointmentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  
  // Calculate the week dates (starting from Sunday)
  const startOfCurrentWeek = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  
  const navigateToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };
  
  const navigateToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };
  
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Format the week range for display (e.g., "May 14 - May 20, 2023")
  const weekRangeText = `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">Schedule and manage your appointments.</p>
        </div>
        <Button className="btn-gradient sm:w-auto w-full">
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Appointment Calendar</CardTitle>
              <CardDescription>View and manage your schedule.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={navigateToToday}>
                Today
              </Button>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={navigateToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium whitespace-nowrap px-2">
                  {weekRangeText}
                </div>
                <Button variant="ghost" size="icon" onClick={navigateToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select defaultValue={currentView} onValueChange={value => setCurrentView(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" value={currentView} onValueChange={setCurrentView}>
            <TabsList className="mb-4 hidden">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
            </TabsList>
            
            <TabsContent value="week" className="m-0">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 border-b">
                  <div className="p-3 text-center border-r bg-muted/20"></div>
                  {weekDays.map((day, index) => (
                    <div 
                      key={index} 
                      className={`p-3 text-center border-r last:border-r-0 ${
                        isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'bg-muted/20'
                      }`}
                    >
                      <div className="font-medium">{format(day, 'E')}</div>
                      <div className="text-sm">{format(day, 'd')}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-8">
                  <div className="border-r">
                    {timeSlots.map((timeSlot, index) => (
                      <div 
                        key={index} 
                        className="h-20 p-2 border-b last:border-b-0 text-xs text-right text-muted-foreground"
                      >
                        {timeSlot}
                      </div>
                    ))}
                  </div>
                  {weekDays.map((day, dayIndex) => (
                    <div key={dayIndex} className="border-r last:border-r-0">
                      {timeSlots.map((_, timeIndex) => {
                        const hour = timeIndex + 9;
                        const dayAppointments = getAppointmentsForDay(day).filter(
                          a => new Date(a.date).getHours() === hour
                        );
                        
                        return (
                          <div 
                            key={timeIndex} 
                            className="h-20 p-1 border-b last:border-b-0 relative"
                          >
                            {dayAppointments.map(appointment => (
                              <div 
                                key={appointment.id}
                                className={`absolute inset-x-1 rounded-md p-2 text-xs overflow-hidden ${
                                  appointment.type === 'Video Call' 
                                    ? 'bg-therapy-purple/20 border-l-4 border-therapy-purple'
                                    : 'bg-therapy-pink/20 border-l-4 border-therapy-pink'
                                }`}
                                style={{
                                  top: '4px',
                                  height: `calc(${appointment.duration / 60 * 100}% - 8px)`,
                                  maxHeight: 'calc(100% - 8px)'
                                }}
                              >
                                <div className="font-medium truncate">{appointment.title}</div>
                                <div className="truncate text-xs">{appointment.clientName}</div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  {format(appointment.date, 'h:mm a')} ({appointment.duration} min)
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="day" className="m-0">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 border-b">
                  <div className="p-3 text-center border-r bg-muted/20"></div>
                  <div 
                    className={`p-3 text-center ${
                      isSameDay(currentDate, new Date()) ? 'bg-primary text-primary-foreground' : 'bg-muted/20'
                    }`}
                  >
                    <div className="font-medium">{format(currentDate, 'EEEE')}</div>
                    <div className="text-sm">{format(currentDate, 'MMMM d, yyyy')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2">
                  <div className="border-r">
                    {timeSlots.map((timeSlot, index) => (
                      <div 
                        key={index} 
                        className="h-20 p-2 border-b last:border-b-0 text-xs text-right text-muted-foreground"
                      >
                        {timeSlot}
                      </div>
                    ))}
                  </div>
                  <div>
                    {timeSlots.map((_, timeIndex) => {
                      const hour = timeIndex + 9;
                      const dayAppointments = getAppointmentsForDay(currentDate).filter(
                        a => new Date(a.date).getHours() === hour
                      );
                      
                      return (
                        <div 
                          key={timeIndex} 
                          className="h-20 p-1 border-b last:border-b-0 relative"
                        >
                          {dayAppointments.map(appointment => (
                            <div 
                              key={appointment.id}
                              className={`absolute inset-x-1 rounded-md p-2 text-xs overflow-hidden ${
                                appointment.type === 'Video Call' 
                                  ? 'bg-therapy-purple/20 border-l-4 border-therapy-purple'
                                  : 'bg-therapy-pink/20 border-l-4 border-therapy-pink'
                              }`}
                              style={{
                                top: '4px',
                                height: `calc(${appointment.duration / 60 * 100}% - 8px)`,
                                maxHeight: 'calc(100% - 8px)'
                              }}
                            >
                              <div className="font-medium truncate">{appointment.title}</div>
                              <div className="truncate">{appointment.clientName}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {format(appointment.date, 'h:mm a')} ({appointment.duration} min)
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="agenda" className="m-0">
              <div className="border rounded-lg">
                {appointments.length > 0 ? (
                  <div className="divide-y">
                    {appointments.map(appointment => (
                      <div key={appointment.id} className="p-4 flex gap-4">
                        <div className="w-32 shrink-0">
                          <div className="font-medium">{format(appointment.date, 'MMMM d')}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(appointment.date, 'h:mm a')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ({appointment.duration} minutes)
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{appointment.title}</div>
                          <div className="text-sm">with {appointment.clientName}</div>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.type === 'Video Call' 
                                ? 'bg-therapy-purple/20 text-therapy-purple'
                                : 'bg-therapy-pink/20 text-therapy-pink'
                            }`}>
                              {appointment.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Cancel</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <h3 className="text-lg font-medium">No appointments scheduled</h3>
                    <p className="text-muted-foreground mt-1">
                      You don't have any upcoming appointments.
                    </p>
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" /> Schedule Appointment
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="month" className="m-0">
              <div className="flex justify-center items-center h-64 border rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Month View Coming Soon</h3>
                  <p className="text-muted-foreground mt-1">
                    Month view is under development. Please use week or day view for now.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Working hours summary */}
      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>Your availability for appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {workingHours.map((schedule) => (
              <div key={schedule.day} className="p-4 rounded-lg border">
                <div className="font-medium">{schedule.day}</div>
                <div className="text-sm text-muted-foreground">{schedule.hours}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;
