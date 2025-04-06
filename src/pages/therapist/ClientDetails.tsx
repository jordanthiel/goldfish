
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, ClipboardList, Mail, Phone, MapPin, UserRound, Clock } from 'lucide-react';
import { format } from 'date-fns';
import ClientForm from '@/components/clients/ClientForm';
import ClientNotesList from '@/components/notes/ClientNotesList';
import { toast } from '@/hooks/use-toast';
import ClientInvite from '@/components/clients/ClientInvite';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [inviteFormOpen, setInviteFormOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchClient = async () => {
      try {
        setLoading(true);
        const clientData = await clientService.getClientWithAppointments(id);
        setClient(clientData);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load client details',
          variant: 'destructive',
        });
        navigate('/dashboard/clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate]);

  const handleClientUpdate = async () => {
    if (!id) return;
    try {
      const updatedClient = await clientService.getClient(id);
      setClient(updatedClient);
      setEditFormOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to refresh client details',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p>Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p>Client not found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/dashboard/clients')}
            >
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{client.first_name} {client.last_name}</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setInviteFormOpen(true)}
          >
            Invite to Portal
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setEditFormOpen(true)}
          >
            Edit Client
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/clients')}
          >
            Back to Clients
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Session Notes</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>
                  Personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{client.first_name} {client.last_name}</span>
                </div>
                
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span>{client.address}</span>
                  </div>
                )}
                
                {client.date_of_birth && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <span>Born: {format(new Date(client.date_of_birth), 'PPP')}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>Status: <span className="font-medium">{client.status}</span></span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Emergency contacts and related information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.emergency_contact ? (
                  <div>
                    <h3 className="font-medium mb-1">Emergency Contact</h3>
                    <p>{client.emergency_contact}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No emergency contact provided</p>
                )}
                
                {client.consent_date && (
                  <div>
                    <h3 className="font-medium mb-1">Consent Information</h3>
                    <p>Consent provided on {format(new Date(client.consent_date), 'PPP')}</p>
                    {client.consent_version && <p>Version: {client.consent_version}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
              <CardDescription>
                Review and manage session notes for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientNotesList clientId={client.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                View upcoming and past appointments for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.appointments && client.appointments.length > 0 ? (
                <div className="space-y-4">
                  {client.appointments.map((appointment: any) => (
                    <div 
                      key={appointment.id} 
                      className="p-4 border rounded-md flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-medium">{appointment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.start_time), 'PPp')} - {format(new Date(appointment.end_time), 'p')}
                        </p>
                        <p className="text-sm mt-1">Status: {appointment.status}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/therapist/session/${appointment.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No appointments scheduled</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {client && (
        <ClientForm 
          open={editFormOpen} 
          onOpenChange={setEditFormOpen} 
          client={client} 
          onClientSaved={handleClientUpdate} 
        />
      )}
      
      {client && (
        <ClientInvite 
          open={inviteFormOpen} 
          onOpenChange={setInviteFormOpen} 
          client={client} 
          onInviteSent={() => {
            toast({
              title: 'Invitation sent',
              description: 'Client has been invited to join the portal'
            });
          }} 
        />
      )}
    </div>
  );
};

export default ClientDetails;
