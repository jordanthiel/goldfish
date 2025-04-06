
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Clock, User, Save } from 'lucide-react';
import { noteService, SessionNote } from '@/services/noteService';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface ClientNotesListProps {
  clientId: string;
  clientName: string;
}

const ClientNotesList = ({ clientId, clientName }: ClientNotesListProps) => {
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<SessionNote | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        if (clientId) {
          const fetchedNotes = await noteService.getClientNotes(clientId);
          setNotes(fetchedNotes);
          if (fetchedNotes.length > 0 && !selectedNote) {
            setSelectedNote(fetchedNotes[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching client notes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load client notes.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [clientId, toast]);

  const handleAddNote = () => {
    setIsAddingNote(true);
    setSelectedNote(null);
    setNewNoteContent('');
  };

  const handleSaveNewNote = async () => {
    if (!newNoteContent.trim()) {
      toast({
        title: 'Error',
        description: 'Note content cannot be empty.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const newNote = await noteService.createNote({
        client_id: clientId,
        content: newNoteContent,
        is_private: true
      });

      toast({
        title: 'Success',
        description: 'Note created successfully.'
      });

      // Refresh notes list
      const updatedNotes = await noteService.getClientNotes(clientId);
      setNotes(updatedNotes);
      
      // Reset form
      setIsAddingNote(false);
      setNewNoteContent('');
      
      // Select the newly created note
      const createdNote = updatedNotes.find(note => note.id === newNote.id);
      if (createdNote) {
        setSelectedNote(createdNote);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create note.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };
  
  // Function to safely render HTML content
  const createMarkup = (htmlContent: string) => {
    return { __html: htmlContent };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
          <CardDescription>Loading notes...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Session Notes</CardTitle>
          <CardDescription>View and manage notes for {clientName}</CardDescription>
        </div>
        <Button onClick={handleAddNote}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {isAddingNote ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">New Session Note</h3>
            <Textarea 
              rows={6} 
              placeholder={`Enter session notes for ${clientName}...`}
              value={newNoteContent}
              onChange={e => setNewNoteContent(e.target.value)}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNewNote}>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </div>
          </div>
        ) : notes.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2 border-r pr-4">
              {notes.map(note => (
                <div 
                  key={note.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedNote?.id === note.id 
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs opacity-80">{formatDate(note.created_at)}</span>
                  </div>
                  <div className="text-sm line-clamp-2" dangerouslySetInnerHTML={createMarkup(selectedNote.content)} />

                  {/* <p className="text-sm line-clamp-2">{note.content}</p> */}
                </div>
              ))}
            </div>
            <div className="md:col-span-2">
              {selectedNote ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(selectedNote.created_at)}</span>
                  </div>
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={createMarkup(selectedNote.content)} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a note to view details or create a new note.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't created any notes for this client yet.
            </p>
            <Button onClick={handleAddNote}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Note
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientNotesList;
