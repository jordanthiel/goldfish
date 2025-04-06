
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
  User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { noteService, SessionNote } from '@/services/noteService';
import RichTextEditor from '@/components/notes/RichTextEditor';

const SessionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState<SessionNote | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchSessionData = async () => {
      try {
        setIsLoading(true);
        // Fetch appointment details
        const appointmentData = await appointmentService.getAppointment(id);
        setAppointment(appointmentData);
        
        // Fetch notes for this appointment
        const notes = await noteService.getAppointmentNotes(id);
        if (notes.length > 0) {
          setNote(notes[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching session data:", error);
        toast({
          title: "Error",
          description: "Failed to load session data",
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
        // Update existing note
        const updatedNote = await noteService.updateNote(note.id, { content });
        setNote(updatedNote);
      } else {
        // Create new note
        const newNote = await noteService.createNote({
          client_id: appointment.client_id,
          content,
          appointment_id: appointment.id,
          is_private: true
        });
        setNote(newNote);
      }
      
      toast({
        title: "Success",
        description: "Session notes saved successfully"
      });
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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{appointment.title}</h1>
              <p className="text-muted-foreground">
                Session with {appointment.client?.first_name} {appointment.client?.last_name}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Session info sidebar */}
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
            
            {/* Notes editor */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Session Notes</CardTitle>
                <CardDescription>
                  Take detailed notes during your session with {appointment.client?.first_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor 
                  initialContent={note?.content || ""}
                  onSave={handleSaveNote}
                />
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {note ? 
                  `Last updated: ${format(parseISO(note.updated_at), 'MMMM d, yyyy h:mm a')}` : 
                  "No notes saved yet"
                }
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
