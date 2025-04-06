
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Plus, User, Calendar, MessageSquare, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ClientForm from './ClientForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ClientList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Fetch clients from Supabase
  const fetchClients = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('clients')
      .select('*, appointments(start_time, end_time)')
      .order('last_name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  };

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled: !!user,
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading clients',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Filter clients based on search query and active tab
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.first_name + ' ' + client.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && client.status === activeTab;
  });

  // Get the most recent appointment for a client
  const getLastSessionDate = (client: any) => {
    if (!client.appointments || client.appointments.length === 0) {
      return 'No sessions yet';
    }
    
    const pastAppointments = client.appointments
      .filter((apt: any) => new Date(apt.end_time) < new Date())
      .sort((a: any, b: any) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());
    
    return pastAppointments.length > 0 
      ? format(new Date(pastAppointments[0].end_time), 'yyyy-MM-dd') 
      : 'No sessions yet';
  };

  // Get the next upcoming appointment for a client
  const getNextSessionDate = (client: any) => {
    if (!client.appointments || client.appointments.length === 0) {
      return 'Not Scheduled';
    }
    
    const futureAppointments = client.appointments
      .filter((apt: any) => new Date(apt.start_time) > new Date())
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    return futureAppointments.length > 0 
      ? format(new Date(futureAppointments[0].start_time), 'yyyy-MM-dd') 
      : 'Not Scheduled';
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setClientFormOpen(true);
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setClientFormOpen(true);
  };

  const handleClientSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">Manage your client relationships.</p>
        </div>
        <Button className="btn-gradient sm:w-auto w-full" onClick={handleAddClient}>
          <Plus className="mr-2 h-4 w-4" /> Add New Client
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Client Management</CardTitle>
          <CardDescription>View and manage all your clients in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              Filter
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="all">All Clients</TabsTrigger>
              <TabsTrigger value="Active">Active</TabsTrigger>
              <TabsTrigger value="Inactive">Inactive</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="m-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple"></div>
                </div>
              ) : filteredClients.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Phone</TableHead>
                        <TableHead className="hidden lg:table-cell">Last Session</TableHead>
                        <TableHead>Next Session</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{`${client.first_name} ${client.last_name}`}</TableCell>
                          <TableCell className="hidden md:table-cell">{client.email || 'N/A'}</TableCell>
                          <TableCell className="hidden lg:table-cell">{client.phone || 'N/A'}</TableCell>
                          <TableCell className="hidden lg:table-cell">{getLastSessionDate(client)}</TableCell>
                          <TableCell>{getNextSessionDate(client)}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {client.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                  <User className="mr-2 h-4 w-4" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="mr-2 h-4 w-4" /> Schedule Session
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" /> Client Notes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No clients found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery 
                      ? `No clients matching "${searchQuery}"`
                      : activeTab !== 'all'
                        ? `You don't have any ${activeTab.toLowerCase()} clients`
                        : "You don't have any clients yet"}
                  </p>
                  <Button onClick={handleAddClient}>
                    <Plus className="mr-2 h-4 w-4" /> Add Your First Client
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        {filteredClients.length > 0 && (
          <CardFooter className="flex justify-between border-t pt-6">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredClients.length}</strong> of <strong>{clients.length}</strong> clients
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <ClientForm 
        open={clientFormOpen} 
        onOpenChange={setClientFormOpen} 
        client={selectedClient} 
        onClientSaved={handleClientSaved} 
      />
    </div>
  );
};

export default ClientList;
