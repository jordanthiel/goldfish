import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Shield
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { noteService, SessionNote } from '@/services/noteService';
import { auditService } from '@/services/auditService';
import RichTextEditor from '@/components/notes/RichTextEditor';

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
  const [note, setNote] = useState<SessionNote | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [showAccessLogs, setShowAccessLogs] = useState(false);
  const [allClientNotes, setAllClientNotes] = useState<SessionNote[]>([]);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchSessionData = async () => {
      try {
        setIsLoading(true);
        const appointmentData = await appointmentService.getAppointment(id);
        setAppointment(appointmentData);
        
        try {
          const appointmentNotes = await noteService.getAppointmentNotes(id);
          
          if (appointmentNotes.length > 0) {
            setNote(appointmentNotes[0]);
            
            try {
              const logs = await auditService.getNoteAccessLogs(appointmentNotes[0].id);
              setAccessLogs(logs);
            } catch (error) {
              console.error("Error fetching access logs:", error);
              setAccessLogs([]);
            }
          } 
          
          if (appointmentData && appointmentData.client_id) {
            const clientNotes = await noteService.getClientNotes(appointmentData.client_id);
            setAllClientNotes(clientNotes);
            
            if (appointmentNotes.length === 0 && clientNotes.length > 0) {
              console.log(`No appointment-specific notes found, but found ${clientNotes.length} client notes`);
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
  
  const handleSaveNote = async (content: string) => {
    if (!appointment) return;
    
    try {
      setIsSaving(true);
      
      if (note) {
        const updatedNote = await noteService.updateNote(note.id, { content });
        setNote(updatedNote);
        
        setAllClientNotes(prevNotes => 
          prevNotes.map(n => n.id === updatedNote.id ? updatedNote : n)
        );
        
        try {
          const logs = await auditService.getNoteAccessLogs(note.id);
          setAccessLogs(logs);
        } catch (error) {
          console.error("Error fetching access logs:", error);
        }
      } else {
        const newNote = await noteService.createNote({
          client_id: appointment.client_id,
          content,
          appointment_id: appointment.id,
          is_private: true
        });
        setNote(newNote);
        
        setAllClientNotes(prevNotes => [newNote, ...prevNotes]);
        
        try {
          const logs = await auditService.getNoteAccessLogs(newNote.id);
          setAccessLogs(logs);
        } catch (error) {
          console.error("Error fetching access logs:", error);
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save session notes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
  
  const formatSessionTime = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };
  
  const formatNoteDate = (date: string) => {
    return format(parseISO(date), 'MMM d, yyyy');
  };
  
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

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
                  Session with {appointment?.client?.first_name} {appointment?.client?.last_name}
                </p>
              </div>
            </div>
            
            {note && (
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
          
          {showAccessLogs && note && (
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
                    <AvatarImage src="/placeholder.svg" alt={`${appointment.client?.first_name} ${appointment.client?.last_name}`} />
                    <AvatarFallback className="bg-therapy-purple text-white">
                      {appointment.client?.first_name?.[0]}{appointment.client?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{appointment.client?.first_name} {appointment.client?.last_name}</p>
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
                      <span>{formatSessionTime(appointment.start_time, appointment.end_time)}</span>
                    </div>
                    {appointment.client?.email && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.client.email}</span>
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
                
                {allClientNotes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">All Patient Notes</h3>
                      <div className="max-h-60 overflow-y-auto">
                        {allClientNotes.map((clientNote) => (
                          <div key={clientNote.id} className="mb-2 text-sm border-b pb-2">
                            <p className="font-medium">{formatNoteDate(clientNote.created_at)}</p>
                            <div className="line-clamp-2 text-muted-foreground" dangerouslySetInnerHTML={createMarkup(clientNote.content)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
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
                <CardTitle>Session Notes</CardTitle>
                <CardDescription>
                  Take detailed notes during your session with {appointment?.client?.first_name}
                </CardDescription>
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
                
                <RichTextEditor 
                  initialContent={note?.content || ""}
                  onSave={handleSaveNote}
                  autoSave={true}
                  autoSaveInterval={2000}
                />
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {note ? 
                  `Last updated: ${format(parseISO(note.updated_at), 'MMMM d, yyyy h:mm a')}` : 
                  "No notes saved yet for this appointment"
                }
                {allClientNotes.length > 0 && !note && (
                  <span className="ml-2">
                    (Patient has {allClientNotes.length} {allClientNotes.length === 1 ? 'note' : 'notes'} in total)
                  </span>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SessionDetails;
