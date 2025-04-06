
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X } from 'lucide-react';
import { SessionNote } from '@/services/noteService';
import RichTextEditor from './RichTextEditor';
import { useToast } from "@/hooks/use-toast";

interface NoteEditDialogProps {
  note: SessionNote | null;
  open: boolean;
  onClose: () => void;
  onSave: (note: SessionNote, content: string) => Promise<void>;
}

const NoteEditDialog = ({ note, open, onClose, onSave }: NoteEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveContent = async (content: string) => {
    if (!note) return;
    
    setIsLoading(true);
    try {
      await onSave(note, content);
      toast({
        title: "Note updated",
        description: "The note has been successfully updated."
      });
      onClose();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update the note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Edit Note</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {note && (
            <RichTextEditor
              initialContent={note.content}
              onSave={handleSaveContent}
            />
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            disabled={isLoading} 
            className="btn-gradient"
            onClick={() => document.execCommand('save')}
          >
            <Save className="mr-2 h-4 w-4" /> 
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteEditDialog;
