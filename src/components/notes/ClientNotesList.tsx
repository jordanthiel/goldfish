import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus } from 'lucide-react';
import { SessionNote, noteService } from '@/services/noteService';
import SessionNoteItem from './SessionNoteItem';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ClientNotesListProps {
  clientId: string;
}

const ClientNotesList: React.FC<ClientNotesListProps> = ({ clientId }) => {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!clientId) {
          setNotes([]);
          return;
        }
        
        const fetchedNotes = await noteService.getClientNotes(clientId);
        setNotes(fetchedNotes);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [clientId]);

  const handleCreateNote = async () => {
    try {
      const createdNote = await noteService.createNote({
        client_id: clientId,
        content: '',
        is_private: true
      });
      
      navigate(`/therapist/notes/${createdNote.id}`);
      
      toast({
        title: "Note created",
        description: "You can now start editing your note."
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create new note.",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Session Notes</h2>
        <Button onClick={handleCreateNote} className="btn-gradient">
          <Plus className="mr-2 h-4 w-4" />New Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No notes found for this client.</p>
          <Button variant="outline" onClick={handleCreateNote}>
            <Plus className="mr-2 h-4 w-4" />Add First Note
          </Button>
        </Card>
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
    </div>
  );
};

export default ClientNotesList;
