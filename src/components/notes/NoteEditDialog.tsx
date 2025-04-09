import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SessionNote } from '@/services/noteService';

export interface NoteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: SessionNote;
  clientId: string;
  onSave: (noteData: any) => Promise<void>;
}

const NoteEditDialog: React.FC<NoteEditDialogProps> = ({
  open,
  onOpenChange,
  note,
  clientId,
  onSave,
}) => {
  const [content, setContent] = useState(note?.content || '');
  const [isPrivate, setIsPrivate] = useState(note?.is_private || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({
        id: note?.id,
        content,
        is_private: isPrivate,
        client_id: clientId,
        appointment_id: note?.appointment_id,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{note?.id ? 'Edit Note' : 'Add New Note'}</DialogTitle>
          <DialogDescription>
            {note?.id 
              ? 'Update the session notes for this client.' 
              : 'Add session notes for this client.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note-content">Note Content</Label>
            <Textarea
              id="note-content"
              placeholder="Enter session notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-private"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
            />
            <Label htmlFor="is-private">
              Mark as private (only visible to you)
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
          >
            {isSaving ? 'Saving...' : note?.id ? 'Update Note' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteEditDialog;
