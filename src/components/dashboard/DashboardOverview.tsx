import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { clientService } from '@/services/clientService';
import { appointmentService } from '@/services/appointmentService';
import { noteService } from '@/services/noteService';
import { Link } from 'react-router-dom';

const DashboardOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user) throw new Error("User not authenticated");
    
    // Fetch clients count
    const clients = await clientService.getClients(user.id);
    const clientsCount = clients.length;
    console.log('clients', clients);
    // Fetch upcoming appointments for next 7 days
    const today = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);
    
    const upcomingAppointments = await appointmentService.getAppointmentsInRange(today, endOfWeek);
    
    // Fetch recent appointments (past two weeks)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    // Get appointments from last two weeks
    const pastTwoWeeksAppointments = await appointmentService.getAppointmentsInRange(twoWeeksAgo, today);
    const recentAppointments = pastTwoWeeksAppointments
      .filter(apt => new Date(apt.end_time) <= today)
      .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())
      .slice(0, 3);
    
    // Fetch recent notes
    // const allNotes = await noteService.getNotes();
    // const recentNotes = allNotes
    //   .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    //   .slice(0, 3);
    
    // Calculate hours booked for current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const monthAppointments = await appointmentService.getAppointmentsInRange(startOfMonth, endOfMonth);
    
    let hoursBooked = 0;
    
    if (monthAppointments) {
      hoursBooked = monthAppointments.reduce((total, apt) => {
        const startTime = new Date(apt.start_time);
        const endTime = new Date(apt.end_time);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return total + durationHours;
      }, 0);
    }
    
    // Calculate client changes month-over-month
    const thisMonthClients = clients.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt.getMonth() === today.getMonth() && 
             createdAt.getFullYear() === today.getFullYear();
    });
    
    // Check last month
    const lastMonth = today.getMonth() - 1 < 0 ? 11 : today.getMonth() - 1;
    const lastMonthYear = today.getMonth() - 1 < 0 ? today.getFullYear() - 1 : today.getFullYear();
    
    const lastMonthClients = clients.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt.getMonth() === lastMonth && 
             createdAt.getFullYear() === lastMonthYear;
    });
    
    const clientsChange = lastMonthClients.length > 0 
      ? Math.round(((thisMonthClients.length || 0) - lastMonthClients.length) / lastMonthClients.length * 100) 
      : thisMonthClients.length ? 100 : 0;
    
    // Calculate session changes and hours booked changes month-over-month  
    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);
    
    const lastMonthAppointments = await appointmentService.getAppointmentsInRange(lastMonthStart, lastMonthEnd);
    
    let lastMonthHoursBooked = 0;
    
    if (lastMonthAppointments) {
      lastMonthHoursBooked = lastMonthAppointments.reduce((total, apt) => {
        const startTime = new Date(apt.start_time);
        const endTime = new Date(apt.end_time);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return total + durationHours;
      }, 0);
    }
    
    const sessionsChange = lastMonthAppointments.length > 0 
      ? Math.round(((monthAppointments.length || 0) - lastMonthAppointments.length) / lastMonthAppointments.length * 100) 
      : monthAppointments.length ? 100 : 0;
      
    const hoursChange = lastMonthHoursBooked > 0 
      ? Math.round(((hoursBooked || 0) - lastMonthHoursBooked) / lastMonthHoursBooked * 100) 
      : hoursBooked > 0 ? 100 : 0;
    
    // For message change we'll use a placeholder since we don't have a messages feature yet
    const messagesChange = "-";
    
    console.log('Fetched clients data:', clients);
    
    return {
      clientsCount: clientsCount || 0,
      upcomingAppointments: upcomingAppointments || [],
      recentAppointments: recentAppointments || [],
      // recentNotes: recentNotes || [],
      hoursBooked: Math.round(hoursBooked * 10) / 10, // round to 1 decimal
      newClientsThisMonth: thisMonthClients.length || 0,
      clientsChange: clientsChange > 0 ? `+${clientsChange}%` : `${clientsChange}%`,
      sessionsChange: sessionsChange > 0 ? `+${sessionsChange}%` : `${sessionsChange}%`,
      messagesChange: messagesChange,
      hoursChange: hoursChange > 0 ? `+${hoursChange}%` : `${hoursChange}%`,
    };
  };

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  console.log('dashdata', dashboardData);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading dashboard data',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Stats for the dashboard
  const stats = [
    {
      title: "Active Clients",
      value: isLoading ? "..." : dashboardData?.clientsCount.toString() || "0",
      description: `${dashboardData?.newClientsThisMonth || 0} new this month`,
      icon: <Users className="h-5 w-5 text-therapy-purple" />,
      change: dashboardData?.clientsChange || "+0%"
    },
    {
      title: "Upcoming Sessions",
      value: isLoading ? "..." : dashboardData?.upcomingAppointments.length.toString() || "0",
      description: "This week",
      icon: <CalendarDays className="h-5 w-5 text-therapy-pink" />,
      change: dashboardData?.sessionsChange || "+0%"
    },
    {
      title: "Messages",
      value: "0", // Not implemented yet
      description: "Unread messages",
      icon: <MessageSquare className="h-5 w-5 text-therapy-purple" />,
      change: dashboardData?.messagesChange || "+0%"
    },
    {
      title: "Hours Booked",
      value: isLoading ? "..." : dashboardData?.hoursBooked.toString() || "0",
      description: "Last 30 days",
      icon: <Clock className="h-5 w-5 text-therapy-pink" />,
      change: dashboardData?.hoursChange || "+0%"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.user_metadata?.full_name || 'Therapist'}. Here's an overview of your practice.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center justify-between">
                {stat.description}
                <span className={`${stat.change.startsWith('+') ? 'text-green-500' : stat.change.startsWith('-') ? 'text-red-500' : 'text-gray-500'} font-medium`}>
                  {stat.change}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest client interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-therapy-purple"></div>
              </div>
            ) : dashboardData?.recentAppointments && dashboardData.recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentAppointments.map((apt: any) => (
                  <Link 
                    key={apt.id} 
                    to={`/therapist/session/${apt.id}`} 
                    className="block hover:bg-muted/40 transition-colors rounded-md"
                  >
                    <div className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0 p-2">
                      <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                        <Users className="h-5 w-5 text-therapy-purple" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Client Session Completed</h4>
                        <p className="text-sm text-muted-foreground">
                          Session with {apt.client?.first_name} {apt.client?.last_name || 'Client'} - {
                            Math.round((new Date(apt.end_time).getTime() - new Date(apt.start_time).getTime()) / (1000 * 60))
                          } minutes
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(apt.end_time), 'MMM d')}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {dashboardData.recentNotes && dashboardData.recentNotes.length > 0 && (
                  dashboardData.recentNotes.map((note: any) => (
                    <Link 
                      key={note.id} 
                      to={`/dashboard/notes`}
                      className="block hover:bg-muted/40 transition-colors rounded-md"
                    >
                      <div className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0 p-2">
                        <div className="w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-therapy-pink" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Note Created</h4>
                          <p className="text-sm text-muted-foreground">
                            Note for {note.client?.first_name} {note.client?.last_name || 'Client'}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(note.created_at), 'MMM d')}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Your next appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-therapy-purple"></div>
              </div>
            ) : dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingAppointments.slice(0, 3).map((apt: any, i: number) => (
                  <Link 
                    key={apt.id} 
                    to={`/therapist/session/${apt.id}`}
                    className="block hover:bg-muted/40 transition-colors rounded-md"
                  >
                    <div className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0 p-2">
                      <div className="w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                        <CalendarDays className="h-5 w-5 text-therapy-pink" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-semibold">{apt.clients?.first_name} {apt.clients?.last_name || 'Client'}</h4>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(apt.start_time), 'EEEE')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.start_time), 'h:mm a')} - {format(new Date(apt.end_time), 'h:mm a')} • {apt.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
