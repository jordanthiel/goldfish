import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon,  
  Clock, 
  ArrowLeft,
  User,
  Shield,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { noteService, SessionNote } from '@/services/noteService';
import { auditService } from '@/services/auditService';
import SessionNoteItem from '@/components/notes/SessionNoteItem';

interface AccessLog {
  access_type: string;
  user_id: string;
  users?: { email: string };
  accessed_at: string;
}

const SessionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [showAccessLogs, setShowAccessLogs] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchSessionData = async () => {
      try {
        setIsLoading(true);
        const appointmentData = await appointmentService.getAppointment(id);
        setAppointment(appointmentData);
        
        try {
          const appointmentNotes = await noteService.getAppointmentNotes(id);
          setNotes(appointmentNotes);
          
          if (appointmentNotes.length > 0) {
            try {
              const logs = await auditService.getNoteAccessLogs(appointmentNotes[0].id);
              setAccessLogs(logs);
            } catch (error) {
              console.error("Error fetching access logs:", error);
              setAccessLogs([]);
            }
          }
        } catch (error) {
          console.error("Error fetching session notes:", error);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching session data:", error);
        toast({
          title: "Error",
          description: "Failed to load appointment details. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    fetchSessionData();
  }, [id, toast]);

  const handleCreateNote = async () => {
    if (!appointment) return;
    
    try {
      const newNote = await noteService.createNote({
        client_id: appointment.client_id,
        appointment_id: appointment.id,
        content: '',
        is_private: true
      });
      
      navigate(`/therapist/notes/${newNote.id}`);
      
      toast({
        title: "Note created",
        description: "You can now start editing your note."
      });
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: "Failed to create note.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            <p>Loading session details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!appointment) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            <p>Session not found or you don't have permission to view it.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{appointment?.title}</h1>
                <p className="text-muted-foreground">
                  Session with {appointment?.client_profiles?.first_name} {appointment?.client_profiles?.last_name}
                </p>
              </div>
            </div>
            
            {notes.length > 0 && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowAccessLogs(!showAccessLogs)}
              >
                <Shield className="h-4 w-4" />
                {showAccessLogs ? "Hide Access Logs" : "View Access Logs"}
              </Button>
            )}
          </div>
          
          <Separator />
          
          {showAccessLogs && notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>HIPAA Access Logs</CardTitle>
                <CardDescription>
                  Record of all access to this patient's session notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessLogs.length > 0 ? (
                  <div className="space-y-4">
                    {accessLogs.map((log, index) => (
                      <div key={index} className="flex justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{log.access_type}</p>
                          <p className="text-sm text-muted-foreground">
                            User: {log.users?.email || log.user_id}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(log.accessed_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No access logs available. This could be due to Row Level Security policies.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" alt={`${appointment.client_profiles?.first_name} ${appointment.client_profiles?.last_name}`} />
                    <AvatarFallback className="bg-therapy-purple text-white">
                      {appointment.client?.first_name?.[0]}{appointment.client?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{appointment.client_profiles?.first_name} {appointment.client_profiles?.last_name}</p>
                    <Badge variant="outline" className="mt-1">
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Session Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(appointment.start_time), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(appointment.start_time), 'h:mm a')} - {format(parseISO(appointment.end_time), 'h:mm a')}</span>
                    </div>
                    {appointment.client_profiles?.email && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.client_profiles.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Session Type</h3>
                  <Badge variant="outline" className="bg-therapy-light-purple text-therapy-purple hover:bg-therapy-light-purple">
                    {appointment.title}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/therapist/client/${appointment.client_id}`)}
                  >
                    View Client Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Session Notes</CardTitle>
                    <CardDescription>
                      Notes from your session with {appointment?.client_profiles?.first_name} {appointment?.client_profiles?.last_name}
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateNote}>
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 p-3 mb-4 rounded-md text-sm">
                  <p className="font-medium text-yellow-800 flex items-center">
                    <Shield className="h-4 w-4 mr-2" /> HIPAA Compliance Notice
                  </p>
                  <p className="text-yellow-700 mt-1">
                    All access to this patient's health information is being logged in accordance with HIPAA requirements.
                  </p>
                </div>
                
                {notes.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No notes have been created for this session yet.</p>
                    <Button onClick={handleCreateNote}>
                      Create First Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map(note => (
                      <SessionNoteItem
                        key={note.id}
                        note={note}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SessionDetails;
