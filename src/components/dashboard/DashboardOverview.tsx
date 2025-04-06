
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const DashboardOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user) throw new Error("User not authenticated");
    
    // Fetch clients count
    const { count: clientsCount, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (clientsError) throw clientsError;
    
    // Fetch upcoming appointments
    const today = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);
    
    const { data: upcomingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*, clients(*)')
      .gte('start_time', today.toISOString())
      .lte('start_time', endOfWeek.toISOString())
      .order('start_time', { ascending: true });
    
    if (appointmentsError) throw appointmentsError;
    
    // Fetch recent appointments (past)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    const { data: recentAppointments, error: recentApptsError } = await supabase
      .from('appointments')
      .select('*, clients(*)')
      .lte('end_time', today.toISOString())
      .gte('end_time', twoWeeksAgo.toISOString())
      .order('end_time', { ascending: false })
      .limit(3);
    
    if (recentApptsError) throw recentApptsError;
    
    // Calculate hours booked
    const { data: monthAppointments, error: monthApptsError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .gte('start_time', new Date(today.getFullYear(), today.getMonth(), 1).toISOString())
      .lte('end_time', today.toISOString());
    
    if (monthApptsError) throw monthApptsError;
    
    let hoursBooked = 0;
    
    if (monthAppointments) {
      hoursBooked = monthAppointments.reduce((total, apt) => {
        const startTime = new Date(apt.start_time);
        const endTime = new Date(apt.end_time);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        return total + durationHours;
      }, 0);
    }
    
    // Calculate changes from previous period
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const { data: lastMonthClients } = await supabase
      .from('clients')
      .select('created_at')
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString());
    
    const { data: thisMonthClients } = await supabase
      .from('clients')
      .select('created_at')
      .gte('created_at', new Date(today.getFullYear(), today.getMonth(), 1).toISOString());
    
    const clientsChange = lastMonthClients?.length > 0 
      ? Math.round(((thisMonthClients?.length || 0) - lastMonthClients.length) / lastMonthClients.length * 100) 
      : thisMonthClients?.length ? 100 : 0;
    
    return {
      clientsCount: clientsCount || 0,
      upcomingAppointments: upcomingAppointments || [],
      recentAppointments: recentAppointments || [],
      hoursBooked: Math.round(hoursBooked * 10) / 10, // round to 1 decimal
      newClientsThisMonth: thisMonthClients?.length || 0,
      clientsChange: clientsChange > 0 ? `+${clientsChange}%` : `${clientsChange}%`,
      sessionsChange: "+12%", // Mock data for now, would calculate similar to clients
      messagesChange: "-2%",  // Mock data for now
      hoursChange: "+5%",     // Mock data for now
    };
  };

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

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
                <span className={`${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'} font-medium`}>
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
                  <div key={apt.id} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                      <Users className="h-5 w-5 text-therapy-purple" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Client Session Completed</h4>
                      <p className="text-sm text-muted-foreground">
                        Session with {apt.clients.first_name} {apt.clients.last_name} - {
                          Math.round((new Date(apt.end_time).getTime() - new Date(apt.start_time).getTime()) / (1000 * 60))
                        } minutes
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(apt.end_time), 'MMM d')}
                    </div>
                  </div>
                ))}
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
                  <div key={apt.id} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-therapy-pink" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-semibold">{apt.clients.first_name} {apt.clients.last_name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(apt.start_time), 'EEEE')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.start_time), 'h:mm a')} - {format(new Date(apt.end_time), 'h:mm a')} • {apt.title}
                      </p>
                    </div>
                  </div>
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
