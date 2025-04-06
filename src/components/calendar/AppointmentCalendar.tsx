
import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, parse, isSameDay, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Clock, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, AppointmentInput } from '@/services/appointmentService';
import { noteService } from '@/services/noteService';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Working hours
const workingHours = [
  { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Friday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Saturday', hours: 'Closed' },
  { day: 'Sunday', hours: 'Closed' }
];

// Time slots for the day view
const timeSlots = Array.from({ length: 9 }, (_, i) => {
  const hour = i + 9; // Start from 9 AM
  return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
});

const AppointmentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    status: 'Scheduled'
  });
  const [clients, setClients] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [existingNotes, setExistingNotes] = useState([]);
  
  const queryClient = useQueryClient();
  
  // Calculate the week dates (starting from Sunday)
  const startOfCurrentWeek = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  
  // Fetch appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAppointments
  });
  
  // Fetch clients for dropdown
  const { data: clientsData = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const clientService = (await import('@/services/clientService')).clientService;
      return clientService.getClients();
    }
  });
  
  useEffect(() => {
    if (clientsData.length > 0) {
      setClients(clientsData);
    }
  }, [clientsData]);
  
  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (appointmentData: AppointmentInput) => appointmentService.createAppointment(appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Appointment created",
        description: "The appointment has been scheduled successfully."
      });
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Save note mutation
  const saveNoteMutation = useMutation({
    mutationFn: (data: { note: string, appointmentId: string }) => {
      return noteService.createNote({
        client_id: selectedAppointment.client_id,
        content: data.note,
        appointment_id: data.appointmentId,
        is_private: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setNoteContent('');
      fetchAppointmentNotes(selectedAppointment.id);
      toast({
        title: "Note saved",
        description: "Your session note has been saved successfully."
      });
    },
    onError: (error) => {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const resetForm = () => {
    setFormData({
      title: '',
      client_id: '',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      status: 'Scheduled'
    });
  };
  
  const handleCreateAppointment = () => {
    const { title, client_id, date, startTime, endTime, notes, status } = formData;
    
    if (!title || !client_id || !date || !startTime || !endTime) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // Combine date and time for start and end
    const startDate = new Date(date);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0);
    
    const endDate = new Date(date);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    endDate.setHours(endHours, endMinutes, 0);
    
    // Create appointment object
    const appointmentData: AppointmentInput = {
      title,
      client_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      notes: notes || null,
      status
    };
    
    createAppointmentMutation.mutate(appointmentData);
  };
  
  const viewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };
  
  const openNotesModal = (appointment) => {
    setSelectedAppointment(appointment);
    fetchAppointmentNotes(appointment.id);
    setIsNotesModalOpen(true);
  };
  
  const fetchAppointmentNotes = async (appointmentId) => {
    try {
      const clientNotes = await noteService.getAppointmentNotes(appointmentId);
      setExistingNotes(clientNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch session notes.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      toast({
        title: "Error",
        description: "Note content cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    
    saveNoteMutation.mutate({
      note: noteContent,
      appointmentId: selectedAppointment.id
    });
  };
  
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

  // Function to get appointments for a specific day
  const getAppointmentsForDay = (day) => {
    if (!appointments.length) return [];
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.start_time);
      return isSameDay(appointmentDate, day);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">Schedule and manage your appointments.</p>
        </div>
        <Button className="btn-gradient sm:w-auto w-full" onClick={() => setIsCreateModalOpen(true)}>
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
                          a => new Date(a.start_time).getHours() === hour
                        );
                        
                        return (
                          <div 
                            key={timeIndex} 
                            className="h-20 p-1 border-b last:border-b-0 relative"
                          >
                            {dayAppointments.map(appointment => {
                              const startTime = new Date(appointment.start_time);
                              const endTime = new Date(appointment.end_time);
                              const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                              
                              return (
                                <div 
                                  key={appointment.id}
                                  className={`absolute inset-x-1 rounded-md p-2 text-xs overflow-hidden cursor-pointer ${
                                    appointment.status === 'Completed' 
                                      ? 'bg-green-100 border-l-4 border-green-500'
                                      : appointment.status === 'Cancelled'
                                      ? 'bg-red-100 border-l-4 border-red-500'
                                      : 'bg-therapy-light-purple border-l-4 border-therapy-purple'
                                  }`}
                                  style={{
                                    top: '4px',
                                    height: `calc(${durationMinutes / 60 * 100}% - 8px)`,
                                    maxHeight: 'calc(100% - 8px)'
                                  }}
                                  onClick={() => viewAppointment(appointment)}
                                >
                                  <div className="font-medium truncate">{appointment.title}</div>
                                  <div className="truncate text-xs">
                                    {appointment.client?.first_name} {appointment.client?.last_name}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    {format(startTime, 'h:mm a')} ({durationMinutes} min)
                                  </div>
                                </div>
                              );
                            })}
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
                        a => new Date(a.start_time).getHours() === hour
                      );
                      
                      return (
                        <div 
                          key={timeIndex} 
                          className="h-20 p-1 border-b last:border-b-0 relative"
                        >
                          {dayAppointments.map(appointment => {
                            const startTime = new Date(appointment.start_time);
                            const endTime = new Date(appointment.end_time);
                            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                            
                            return (
                              <div 
                                key={appointment.id}
                                className={`absolute inset-x-1 rounded-md p-2 text-xs overflow-hidden cursor-pointer ${
                                  appointment.status === 'Completed' 
                                    ? 'bg-green-100 border-l-4 border-green-500'
                                    : appointment.status === 'Cancelled'
                                    ? 'bg-red-100 border-l-4 border-red-500'
                                    : 'bg-therapy-light-purple border-l-4 border-therapy-purple'
                                }`}
                                style={{
                                  top: '4px',
                                  height: `calc(${durationMinutes / 60 * 100}% - 8px)`,
                                  maxHeight: 'calc(100% - 8px)'
                                }}
                                onClick={() => viewAppointment(appointment)}
                              >
                                <div className="font-medium truncate">{appointment.title}</div>
                                <div className="truncate text-xs">
                                  {appointment.client?.first_name} {appointment.client?.last_name}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  {format(startTime, 'h:mm a')} ({durationMinutes} min)
                                </div>
                              </div>
                            );
                          })}
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
                    {appointments.map(appointment => {
                      const startTime = new Date(appointment.start_time);
                      const endTime = new Date(appointment.end_time);
                      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                      
                      return (
                        <div key={appointment.id} className="p-4 flex gap-4">
                          <div className="w-32 shrink-0">
                            <div className="font-medium">{format(startTime, 'MMMM d')}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(startTime, 'h:mm a')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ({durationMinutes} minutes)
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{appointment.title}</div>
                            <div className="text-sm">
                              with {appointment.client?.first_name} {appointment.client?.last_name}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appointment.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-therapy-purple/20 text-therapy-purple'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => viewAppointment(appointment)}>
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openNotesModal(appointment)}>
                              <FileText className="h-4 w-4 mr-1" /> Notes
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <h3 className="text-lg font-medium">No appointments scheduled</h3>
                    <p className="text-muted-foreground mt-1">
                      You don't have any upcoming appointments.
                    </p>
                    <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
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
      
      {/* Create Appointment Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule a new appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Initial Consultation"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about the appointment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAppointment}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Appointment Modal */}
      {selectedAppointment && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedAppointment.title}</DialogTitle>
              <DialogDescription>
                Appointment details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Client</h4>
                <p>{selectedAppointment.client?.first_name} {selectedAppointment.client?.last_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <p>{format(new Date(selectedAppointment.start_time), 'PPP')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
                  <p>
                    {format(new Date(selectedAppointment.start_time), 'h:mm a')} - 
                    {format(new Date(selectedAppointment.end_time), 'h:mm a')}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedAppointment.status === 'Completed' 
                    ? 'bg-green-100 text-green-800'
                    : selectedAppointment.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-therapy-purple/20 text-therapy-purple'
                }`}>
                  {selectedAppointment.status}
                </span>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="mt-1 text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
              <Button onClick={() => {
                setIsViewModalOpen(false);
                openNotesModal(selectedAppointment);
              }}>
                <FileText className="h-4 w-4 mr-2" /> Session Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Session Notes Modal */}
      {selectedAppointment && (
        <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Session Notes</DialogTitle>
              <DialogDescription>
                {selectedAppointment.client?.first_name} {selectedAppointment.client?.last_name} - 
                {format(new Date(selectedAppointment.start_time), 'PPP')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {existingNotes.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {existingNotes.map(note => (
                    <div key={note.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(note.created_at), 'PPP h:mm a')}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          note.is_private 
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {note.is_private ? 'Private' : 'Shared'}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No notes yet</h3>
                  <p className="text-muted-foreground">
                    Add a note below to record information about this session.
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Label htmlFor="sessionNote">Add New Note</Label>
                <Textarea
                  id="sessionNote"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter your session notes..."
                  rows={5}
                  className="mt-2"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNotesModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveNote}>Save Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AppointmentCalendar;
