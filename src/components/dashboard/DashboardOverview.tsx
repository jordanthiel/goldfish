
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, MessageSquare, Clock } from 'lucide-react';

const DashboardOverview = () => {
  // Mock data - in a real app, this would come from an API
  const stats = [
    {
      title: "Active Clients",
      value: "24",
      description: "3 new this month",
      icon: <Users className="h-5 w-5 text-therapy-purple" />,
      change: "+14%"
    },
    {
      title: "Upcoming Sessions",
      value: "12",
      description: "This week",
      icon: <CalendarDays className="h-5 w-5 text-therapy-pink" />,
      change: "+5%"
    },
    {
      title: "Messages",
      value: "8",
      description: "Unread messages",
      icon: <MessageSquare className="h-5 w-5 text-therapy-purple" />,
      change: "-2%"
    },
    {
      title: "Hours Booked",
      value: "36",
      description: "Last 30 days",
      icon: <Clock className="h-5 w-5 text-therapy-pink" />,
      change: "+12%"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back. Here's an overview of your practice.</p>
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
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-therapy-light-purple flex items-center justify-center">
                    <Users className="h-5 w-5 text-therapy-purple" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Client Session Completed</h4>
                    <p className="text-sm text-muted-foreground">
                      Session with Jane Smith - 45 minutes
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">2h ago</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Your next appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-therapy-soft-pink flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-therapy-pink" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-semibold">John Doe</h4>
                      <span className="text-sm text-muted-foreground">
                        {i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Wednesday"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {`3:${i * 2}0 PM - 4:${i * 2}0 PM`} • Initial Consultation
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
