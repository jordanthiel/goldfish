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
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ClientForm from './ClientForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientService, Client } from '@/services/clientService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getClients } from '@/services/clientService';
import { formatDate } from '@/utils/dateUtils';

const ClientList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        if (!user?.id) return;
        const fetchedClients = await getClients(user.id);
        setClients(fetchedClients);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch clients');
        setLoading(false);
      }
    };

    fetchClients();
  }, [user?.id]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading clients',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Filter clients based on search query and active tab
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.client_profile.first_name + ' ' + client.client_profile.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.client_profile.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && client.status === activeTab;
  });

  // Get the most recent appointment for a client
  const getLastSessionDate = (client: Client) => {
    if (!client.appointmentsList || client.appointmentsList.length === 0) {
      return 'No sessions yet';
    }
    
    const pastAppointments = client.appointmentsList
      .filter((apt) => new Date(apt.end_time) < new Date())
      .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());
    
    return pastAppointments.length > 0 
      ? format(new Date(pastAppointments[0].end_time), 'yyyy-MM-dd') 
      : 'No sessions yet';
  };

  // Get the next upcoming appointment for a client
  const getNextSessionDate = (client: Client) => {
    if (!client.appointmentsList || client.appointmentsList.length === 0) {
      return 'Not Scheduled';
    }
    
    const futureAppointments = client.appointmentsList
      .filter((apt) => new Date(apt.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    return futureAppointments.length > 0 
      ? format(new Date(futureAppointments[0].start_time), 'yyyy-MM-dd') 
      : 'Not Scheduled';
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setClientFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientFormOpen(true);
  };

  const handleClientSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['therapist_clients'] });
  };

  const handleClientClick = (client: Client) => {
    navigate(`/therapist/client/${client.client_profile.id}`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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
              {loading ? (
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
                        <TableRow 
                          key={client.id} 
                          onClick={() => handleClientClick(client)}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-medium">{`${client.client_profile.first_name} ${client.client_profile.last_name}`}</TableCell>
                          <TableCell className="hidden md:table-cell">{client.client_profile.email || 'N/A'}</TableCell>
                          <TableCell className="hidden lg:table-cell">{client.client_profile.phone || 'N/A'}</TableCell>
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
                          <TableCell onClick={(e) => e.stopPropagation()}>
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
