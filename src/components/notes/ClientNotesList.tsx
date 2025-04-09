import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionNote } from '@/services/noteService';
import { formatDate } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, FileEdit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ClientNotesListProps {
  clientId: string;
  notes: SessionNote[];
  onEditNote: (note: SessionNote) => void;
  onDeleteNote: (noteId: string) => Promise<void>;
}

const ClientNotesList: React.FC<ClientNotesListProps> = ({ clientId, notes, onEditNote, onDeleteNote }) => {
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteNote(noteToDelete);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (notes.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No notes found for this client.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {notes.map((note) => (
        <Card key={note.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  Session Note
                  {note.is_private && (
                    <Badge variant="outline" className="ml-2 bg-yellow-50">Private</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {formatDate(note.created_at)}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleNoteExpansion(note.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEditNote(note)}
                >
                  <FileEdit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <AlertDialog open={noteToDelete === note.id} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => setNoteToDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the note
                        and remove it from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteNote}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          
          {expandedNoteId === note.id && (
            <CardContent>
              <div className="whitespace-pre-wrap">
                {note.content}
              </div>
            </CardContent>
          )}
          
          {expandedNoteId !== note.id && (
            <CardFooter className="border-t pt-3 pb-3">
              <p className="text-sm text-muted-foreground truncate">
                {note.content.substring(0, 100)}
                {note.content.length > 100 ? '...' : ''}
              </p>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ClientNotesList;
