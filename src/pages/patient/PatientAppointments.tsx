import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '@/services/patientService';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import PatientLayout from '@/components/layout/PatientLayout';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const PatientAppointments = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([]);

  // Fetch patient dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['patientDashboard'],
    queryFn: patientService.getPatientDashboardData,
  });

  // Extract appointments from dashboard data
  const allAppointments = [
    ...(dashboardData?.upcomingAppointments || []),
    ...(dashboardData?.recentAppointments || [])
  ];

  // Get appointments for the selected date
  const appointmentsForSelectedDate = allAppointments.filter(appointment => {
    if (!selectedDate) return false;
    const appointmentDate = new Date(appointment.start_time);
    return (
      appointmentDate.getDate() === selectedDate.getDate() &&
      appointmentDate.getMonth() === selectedDate.getMonth() &&
      appointmentDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Update appointment dates for calendar highlighting
  useEffect(() => {
    if (allAppointments.length > 0) {
      const dates = allAppointments.map(appointment => new Date(appointment.start_time));
      setAppointmentDates(dates);
    }
  }, [allAppointments]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading appointments',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Format appointment time
  const formatAppointmentTime = (startTime: string, endTime: string) => {
    return `${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}`;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PatientLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  appointment: appointmentDates,
                }}
                modifiersStyles={{
                  appointment: {
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    borderRadius: '100%',
                  },
                }}
              />
            </CardContent>
          </Card>
          
          {/* Appointments for selected date */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
              <CardDescription>
                {appointmentsForSelectedDate.length > 0 
                  ? `${appointmentsForSelectedDate.length} appointment(s) scheduled` 
                  : 'No appointments scheduled for this date'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple"></div>
                </div>
              ) : appointmentsForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {appointmentsForSelectedDate.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{appointment.title || 'Therapy Session'}</h3>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {formatAppointmentTime(appointment.start_time, appointment.end_time)}
                      </div>
                      {appointment.type && (
                        <div className="text-sm text-gray-600 mb-2">
                          Type: {appointment.type}
                        </div>
                      )}
                      {appointment.notes && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">Notes:</p>
                          <p className="text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">
                    {selectedDate 
                      ? 'No appointments scheduled for this date. Select another date or contact your therapist to schedule a session.'
                      : 'Please select a date to view appointments.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Upcoming Appointments */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Your next scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple"></div>
                </div>
              ) : dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Date</th>
                        <th className="text-left py-2 px-4">Time</th>
                        <th className="text-left py-2 px-4">Type</th>
                        <th className="text-left py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.upcomingAppointments.map((appointment) => (
                        <tr key={appointment.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{format(new Date(appointment.start_time), 'MMMM d, yyyy')}</td>
                          <td className="py-2 px-4">{formatAppointmentTime(appointment.start_time, appointment.end_time)}</td>
                          <td className="py-2 px-4">{appointment.title || 'Therapy Session'}</td>
                          <td className="py-2 px-4">
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">
                    You don't have any upcoming appointments. Contact your therapist to schedule a session.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientAppointments;
