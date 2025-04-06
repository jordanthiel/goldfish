import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Save, Clock, User, AlignLeft, Tag, Paperclip, Shield, AlertTriangle } from 'lucide-react';
import { noteService, SessionNoteWithClient } from '@/services/noteService';
import { clientService } from '@/services/clientService';
import { auditService } from '@/services/auditService';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

const SessionNotes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<SessionNoteWithClient | null>(null);
  const [notes, setNotes] = useState<SessionNoteWithClient[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const [editNote, setEditNote] = useState({
    title: '',
    content: '',
    clientId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    tags: ''
  });
  
  // Add a new state for access logs
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  const { toast } = useToast();

  // Load notes and clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedNotes, fetchedClients] = await Promise.all([
          noteService.getNotes(),
          clientService.getClients()
        ]);
        
        setNotes(fetchedNotes);
        if (fetchedNotes.length > 0) {
          setSelectedNote(fetchedNotes[0]);
          
          // Fetch access logs for the selected note
          const logs = await auditService.getNoteAccessLogs(fetchedNotes[0].id);
          setAccessLogs(logs);
        }
        
        setClients(fetchedClients);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notes and clients.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // When a note is selected, update the edit form and fetch access logs
  useEffect(() => {
    if (selectedNote) {
      setEditNote({
        title: selectedNote.id,
        content: selectedNote.content,
        clientId: selectedNote.client_id,
        date: format(new Date(selectedNote.created_at), 'yyyy-MM-dd'),
        tags: ''
      });
      
      // Fetch access logs for the selected note
      const fetchLogs = async () => {
        try {
          const logs = await auditService.getNoteAccessLogs(selectedNote.id);
          setAccessLogs(logs);
        } catch (error) {
          console.error('Error fetching access logs:', error);
        }
      };
      
      fetchLogs();
    }
  }, [selectedNote]);

  const filteredNotes = notes.filter(note => {
    const clientName = note.client ? `${note.client.first_name} ${note.client.last_name}` : '';
    return (
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    
    try {
      const updatedNote = await noteService.updateNote(selectedNote.id, {
        content: editNote.content,
        client_id: editNote.clientId
      });
      
      // Update the notes list
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === updatedNote.id ? { ...note, ...updatedNote } : note
        )
      );
      
      setSelectedNote(prev => prev ? { ...prev, ...updatedNote } : null);
      setActiveTab('view');
      
      toast({
        title: 'Note updated',
        description: 'The session note has been updated successfully.'
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the note.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateNote = async () => {
    // Reset form for a new note
    setEditNote({
      title: '',
      content: '',
      clientId: clients.length > 0 ? clients[0].id : '',
      date: format(new Date(), 'yyyy-MM-dd'),
      tags: ''
    });
    
    setSelectedNote(null);
    setActiveTab('edit');
  };

  const handleSaveNewNote = async () => {
    if (!editNote.clientId || !editNote.content) {
      toast({
        title: 'Missing information',
        description: 'Please provide both client and note content.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const newNote = await noteService.createNote({
        client_id: editNote.clientId,
        content: editNote.content,
        is_private: true
      });
      
      // Fetch the complete note with client info
      const updatedNotes = await noteService.getNotes();
      setNotes(updatedNotes);
      
      // Find and select the new note
      const createdNoteWithClient = updatedNotes.find(note => note.id === newNote.id);
      if (createdNoteWithClient) {
        setSelectedNote(createdNoteWithClient);
      }
      
      setActiveTab('view');
      
      toast({
        title: 'Note created',
        description: 'The session note has been created successfully.'
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the note.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Session Notes</h2>
            <p className="text-muted-foreground">Loading session notes...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Notes</h2>
          <p className="text-muted-foreground">Record and manage your client session notes.</p>
        </div>
        <Button className="btn-gradient sm:w-auto w-full" onClick={handleCreateNote}>
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>
      
      {/* HIPAA compliance notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Shield className="h-6 w-6 text-blue-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-700">HIPAA Compliance Active</h3>
              <p className="text-sm text-blue-600 mt-1">
                All note access and modifications are being logged according to HIPAA requirements.
                Patient data is encrypted and audit logs are being maintained.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notes list sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Client Notes</CardTitle>
            <CardDescription>All client session notes</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search notes..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="h-[600px] overflow-auto">
            <div className="space-y-2">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div 
                    key={note.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedNote?.id === note.id 
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold truncate">
                        {note.client ? `${note.client.first_name} ${note.client.last_name}` : 'Unknown Client'}
                      </h4>
                      <span className="text-xs opacity-80">{formatDate(note.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <User className="h-3 w-3" />
                      <span>{note.client ? `${note.client.first_name} ${note.client.last_name}` : 'Unknown Client'}</span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No notes found. Create your first note!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Note detail/editor */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Note Details</CardTitle>
              <CardDescription>View and edit session notes</CardDescription>
            </div>
            
            {selectedNote && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowLogs(!showLogs)}
              >
                <Shield className="h-4 w-4" />
                {showLogs ? "Hide Logs" : "Access Logs"}
              </Button>
            )}
          </CardHeader>
          
          <CardContent>
            {showLogs && selectedNote && (
              <div className="mb-6 border rounded-lg p-4">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4" /> 
                  HIPAA Access Logs
                </h3>
                
                {accessLogs.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {accessLogs.map((log, index) => (
                      <div key={index} className="flex justify-between text-xs border-b pb-1">
                        <span>{log.access_type}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(log.accessed_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No access logs available</p>
                )}
              </div>
            )}
            
            {selectedNote || activeTab === 'edit' ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="view" disabled={!selectedNote}>View</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                </TabsList>
                
                <TabsContent value="view" className="space-y-6">
                  {selectedNote && (
                    <>
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          {selectedNote.client 
                            ? `${selectedNote.client.first_name} ${selectedNote.client.last_name}` 
                            : 'Unknown Client'}
                        </h2>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" /> 
                            {selectedNote.client 
                              ? `${selectedNote.client.first_name} ${selectedNote.client.last_name}` 
                              : 'Unknown Client'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" /> 
                            {formatDate(selectedNote.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="prose max-w-none">
                        <p>{selectedNote.content}</p>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="edit" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client</label>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={editNote.clientId}
                      onChange={(e) => setEditNote({...editNote, clientId: e.target.value})}
                    >
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {`${client.first_name} ${client.last_name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input 
                      type="date" 
                      value={editNote.date}
                      onChange={(e) => setEditNote({...editNote, date: e.target.value})}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Note Content</label>
                    <Textarea 
                      rows={12} 
                      value={editNote.content}
                      onChange={(e) => setEditNote({...editNote, content: e.target.value})}
                      placeholder="Enter your session notes here..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-16">
                <AlignLeft className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">No Note Selected</h3>
                <p className="text-muted-foreground mb-6">Select a note from the sidebar or create a new one.</p>
                <Button className="btn-gradient" onClick={handleCreateNote}>
                  <Plus className="mr-2 h-4 w-4" /> Create Note
                </Button>
              </div>
            )}
          </CardContent>
          {(selectedNote || activeTab === 'edit') && (
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" onClick={() => {
                if (selectedNote) {
                  setActiveTab('view');
                } else {
                  setEditNote({
                    title: '',
                    content: '',
                    clientId: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    tags: ''
                  });
                }
              }}>
                Cancel
              </Button>
              <Button 
                className="btn-gradient"
                onClick={selectedNote ? handleSaveNote : handleSaveNewNote}
              >
                <Save className="mr-2 h-4 w-4" /> {selectedNote ? 'Save Changes' : 'Create Note'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SessionNotes;
