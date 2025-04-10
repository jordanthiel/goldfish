import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SessionNote } from '@/services/noteService';

interface SessionNoteItemProps {
  note: SessionNote;
}

const SessionNoteItem: React.FC<SessionNoteItemProps> = ({ note }) => {
  const navigate = useNavigate();

  const handleViewNote = () => {
    navigate(`/therapist/notes/${note.id}`);
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleViewNote}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Session Note
              {note.is_private && (
                <Badge variant="outline" className="bg-yellow-50">Private</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {formatDate(note.created_at)}
            </CardDescription>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
    </Card>
  );
};

export default SessionNoteItem;
