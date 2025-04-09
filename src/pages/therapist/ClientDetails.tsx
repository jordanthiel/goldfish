import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  FileText, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  AlertTriangle, 
  Settings, 
  Plus 
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Appointment, Client, clientService } from '@/services/clientService';
import { SessionNote, noteService } from '@/services/noteService';
import ClientForm from '@/components/clients/ClientForm';
import ClientNotesList from '@/components/notes/ClientNotesList';
import NoteEditDialog from '@/components/notes/NoteEditDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [noteEditOpen, setNoteEditOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SessionNote | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const clientData = await clientService.getClientWithAppointments(clientId);
        
        setClient({
          ...clientData,
          email: clientData.email || '',
        });
        
        if (clientData.appointmentsList) {
          setAppointments(clientData.appointmentsList);
        }
        
        const clientNotes = await noteService.getClientNotes(clientId);
        setNotes(clientNotes);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load client data');
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load client data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId, toast]);

  const handleEditClient = () => {
    setClientFormOpen(true);
  };

  const handleClientSaved = async () => {
    if (!clientId) return;
    
    try {
      const updatedClient = await clientService.getClientWithAppointments(clientId);
      
      setClient({
        ...updatedClient,
        email: updatedClient.email || '',
      });
      
      if (updatedClient?.appointmentsList) {
        setAppointments(updatedClient.appointmentsList);
      }
      
      toast({
        title: 'Success',
        description: 'Client information updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: typeof err === 'string' ? err : 'Failed to refresh client data',
        variant: 'destructive',
      });
    }
  };

  const handleAddNote = () => {
    setSelectedNote(null);
    setNoteEditOpen(true);
  };

  const handleEditNote = (note: SessionNote) => {
    setSelectedNote(note);
    setNoteEditOpen(true);
  };

  const handleSaveNote = async (noteData: any) => {
    if (!clientId) return;
    
    try {
      let savedNote;
      
      if (selectedNote) {
        savedNote = await noteService.updateNote(selectedNote.id, {
          ...noteData,
          client_id: clientId,
        });
      } else {
        savedNote = await noteService.createNote({
          ...noteData,
          client_id: clientId,
        });
      }
      
      const updatedNotes = await noteService.getClientNotes(clientId);
      setNotes(updatedNotes);
      
      toast({
        title: 'Success',
        description: selectedNote ? 'Note updated successfully.' : 'Note created successfully.',
      });
      
      setNoteEditOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save note.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const result = await noteService.deleteNote(noteId);
      
      if (result.success) {
        const updatedNotes = await noteService.getClientNotes(clientId!);
        setNotes(updatedNotes);
        
        toast({
          title: 'Success',
          description: 'Note deleted successfully.',
        });
      } else {
        throw new Error(result.message || 'Failed to delete note');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete note.',
        variant: 'destructive',
      });
    }
  };

  const handleStartSession = () => {
    toast({
      title: 'Not implemented',
      description: 'Starting a new session is not implemented yet.',
    });
  };

  const handleSendMessage = () => {
    toast({
      title: 'Not implemented',
      description: 'Sending messages is not implemented yet.',
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Client not found. Please check the client ID and try again.'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/dashboard/clients')}>
            Return to Client List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{`${client.first_name} ${client.last_name}`}</h2>
          <p className="text-muted-foreground">Client Details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSendMessage}>
            <Mail className="mr-2 h-4 w-4" /> Message
          </Button>
          <Button variant="default" onClick={handleStartSession}>
            <Plus className="mr-2 h-4 w-4" /> New Session
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" /> Appointments
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" /> Notes
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>Personal details and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Contact Information</h3>
                    <ul className="space-y-3">
                      {client.email && (
                        <li className="flex items-start">
                          <Mail className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p>{client.email}</p>
                          </div>
                        </li>
                      )}
                      
                      {client.phone && (
                        <li className="flex items-start">
                          <Phone className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p>{client.phone}</p>
                          </div>
                        </li>
                      )}
                      
                      {client.address && (
                        <li className="flex items-start">
                          <MapPin className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="whitespace-pre-line">{client.address}</p>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Additional Information</h3>
                    <ul className="space-y-3">
                      {client.emergency_contact && (
                        <li>
                          <p className="text-sm text-muted-foreground">Emergency Contact</p>
                          <p>{client.emergency_contact}</p>
                        </li>
                      )}
                      
                      {client.date_of_birth && (
                        <li>
                          <p className="text-sm text-muted-foreground">Date of Birth</p>
                          <p>{client.date_of_birth}</p>
                        </li>
                      )}
                      
                      <li>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            client.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.status}
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={handleEditClient}>Edit Information</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Client Summary</CardTitle>
                <CardDescription>Overview and recent activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Client Since</h3>
                  <p>{formatDate(client.created_at)}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Last Appointment</h3>
                  {appointments && appointments.length > 0 ? (
                    <p>{formatDate(appointments[0].start_time)}</p>
                  ) : (
                    <p className="text-muted-foreground">No appointments yet</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Total Appointments</h3>
                  <p>{appointments ? appointments.length : 0}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Upcoming Appointments</h3>
                  {appointments && appointments.filter(apt => new Date(apt.start_time) > new Date()).length > 0 ? (
                    <p>{appointments.filter(apt => new Date(apt.start_time) > new Date()).length}</p>
                  ) : (
                    <p className="text-muted-foreground">No upcoming appointments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Appointments History</CardTitle>
                  <CardDescription>All past and upcoming appointments for this client.</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Schedule Appointment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {appointments && appointments.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {format(new Date(appointment.start_time), 'PPP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {format(new Date(appointment.start_time), 'h:mm a')} - {format(new Date(appointment.end_time), 'h:mm a')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : appointment.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {appointment.notes ? 
                              appointment.notes.length > 50 
                                ? `${appointment.notes.substring(0, 50)}...` 
                                : appointment.notes
                              : 'No notes'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/therapist/session/${appointment.id}`)}>
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2">No appointments yet</h3>
                  <p className="text-muted-foreground mb-4">
                    This client doesn't have any scheduled appointments.
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Schedule First Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Client Notes</h3>
            <Button onClick={handleAddNote}>
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </div>
          
          <ClientNotesList 
            clientId={clientId || ''} 
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
          />
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Client Settings</CardTitle>
              <CardDescription>Manage client account and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {client.email ? (
                <div>
                  <h3 className="font-medium mb-2">Client Portal Access</h3>
                  <p className="mb-4">
                    Current status: <span className="font-medium">Not Activated</span>
                  </p>
                  <Button>
                    <Mail className="mr-2 h-4 w-4" /> Send Portal Invitation
                  </Button>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium mb-2">Client Portal Access</h3>
                  <p className="mb-4 text-muted-foreground">
                    Add an email address to the client profile to send a portal invitation.
                  </p>
                  <Button variant="outline" onClick={handleEditClient}>
                    Add Email Address
                  </Button>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Danger Zone</h3>
                <p className="text-muted-foreground mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <div className="space-y-3">
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    Archive Client
                  </Button>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    Delete Client
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ClientForm 
        open={clientFormOpen} 
        onOpenChange={setClientFormOpen} 
        client={client} 
        onClientSaved={handleClientSaved} 
      />
      
      <NoteEditDialog
        open={noteEditOpen}
        onOpenChange={setNoteEditOpen}
        note={selectedNote}
        clientId={clientId || ''}
        onSave={handleSaveNote}
      />
    </div>
  );
};

export default ClientDetails;
