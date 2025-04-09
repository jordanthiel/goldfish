
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileEdit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SessionNote } from '@/services/noteService';

interface SessionNoteItemProps {
  note: SessionNote;
  isExpanded: boolean;
  onToggleExpand: (noteId: string) => void;
  onEdit: (note: SessionNote) => void;
  onDelete: (noteId: string) => void;
}

const SessionNoteItem: React.FC<SessionNoteItemProps> = ({
  note,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete
}) => {
  return (
    <Card className="overflow-hidden">
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
              onClick={() => onToggleExpand(note.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(note)}
            >
              <FileEdit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="whitespace-pre-wrap">
            {note.content}
          </div>
        </CardContent>
      )}
      
      {!isExpanded && (
        <CardFooter className="border-t pt-3 pb-3">
          <p className="text-sm text-muted-foreground truncate">
            {note.content.substring(0, 100)}
            {note.content.length > 100 ? '...' : ''}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default SessionNoteItem;
