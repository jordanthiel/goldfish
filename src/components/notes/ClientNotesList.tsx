
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SessionNote, noteService } from '@/services/noteService';
import SessionNoteItem from './SessionNoteItem';

export interface ClientNotesListProps {
  clientId: string;
  onEditNote: (note: SessionNote) => void;
  onDeleteNote: (noteId: string) => Promise<void>;
}

const ClientNotesList: React.FC<ClientNotesListProps> = ({ 
  clientId,
  onEditNote,
  onDeleteNote
}) => {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  
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
  
  const handleToggleExpand = (noteId: string) => {
    setExpandedNoteId(prevId => prevId === noteId ? null : noteId);
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
  
  if (notes.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground mb-4">No notes found for this client.</p>
        <Button variant="outline" onClick={() => onEditNote({
          id: '',
          therapist_id: '',
          client_id: clientId,
          content: '',
          is_private: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })}>
          Add First Note
        </Button>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {notes.map(note => (
        <SessionNoteItem
          key={note.id}
          note={note}
          isExpanded={expandedNoteId === note.id}
          onToggleExpand={handleToggleExpand}
          onEdit={() => onEditNote(note)}
          onDelete={() => onDeleteNote(note.id)}
        />
      ))}
    </div>
  );
};

export default ClientNotesList;
