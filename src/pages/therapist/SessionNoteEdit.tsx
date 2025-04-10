import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { noteService, SessionNote } from '@/services/noteService';
import { clientService, Client } from '@/services/clientService';
import RichTextEditor from '@/components/notes/RichTextEditor';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { format } from 'date-fns';
import { auditService } from '@/services/auditService';

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
}

const SessionNoteEdit = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState<SessionNote | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;

      try {
        setIsLoading(true);
        const allNotes = await noteService.getAllNotes();
        const fetchedNote = allNotes.find(note => note.id === noteId);
        
        if (!fetchedNote) {
          throw new Error('Note not found');
        }
        
        setNote(fetchedNote);
        setIsPrivate(fetchedNote.is_private);

        const client = await clientService.getClientById(fetchedNote.client_id);
        if (client) {
          setClientName(`${client.client_profile.first_name} ${client.client_profile.last_name}`);
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        toast({
          title: 'Error',
          description: 'Failed to load the note. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    auditService.logNoteAccess(noteId, 'view');

    fetchNote();
  }, [noteId, toast]);

  const handleUpdateNote = async (content: string) => {
    if (!note) return;

    try {
      const updatedNote = await noteService.updateNote(note.id, {
        content,
        is_private: isPrivate
      });
      setNote(updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note changes.',
        variant: 'destructive'
      });
    }
  };

  const handleBack = () => {
    navigate(`/therapist/client/${note?.client_id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/4 bg-muted rounded"></div>
            <div className="h-[600px] bg-muted rounded"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Note Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  The note you're looking for couldn't be found or you don't have permission to view it.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Client
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
              <h1 className="text-2xl font-bold">Session Note</h1>
              <Badge variant="outline" className="ml-2">
                {format(new Date(note.created_at), 'PPP')}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                />
                <label
                  htmlFor="private"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Private Note
                </label>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Note for {clientName}</CardTitle>
                  <CardDescription>
                    Created on {format(new Date(note.created_at), 'MMMM d, yyyy')} at{' '}
                    {format(new Date(note.created_at), 'h:mm a')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-100 p-3 mb-4 rounded-md">
                <div className="flex gap-2">
                  <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800">HIPAA Compliance Notice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This note is being recorded in accordance with HIPAA requirements. 
                      All changes are logged and stored securely.
                    </p>
                  </div>
                </div>
              </div>

              <RichTextEditor
                initialContent={note.content}
                onSave={handleUpdateNote}
                autoSave={true}
                autoSaveInterval={2000}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SessionNoteEdit; 