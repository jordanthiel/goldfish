
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Save, Clock, User, AlignLeft, Tag, Paperclip } from 'lucide-react';

// Mock notes data
const clientNotes = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    title: 'Initial Assessment',
    date: '2023-05-10',
    content: 'Client presented with symptoms of anxiety, particularly in social situations. Discussed childhood experiences and family dynamics. Client is open to CBT approach.',
    tags: ['Anxiety', 'CBT', 'Initial']
  },
  {
    id: 2,
    clientName: 'Michael Chen',
    title: 'Progress Session #3',
    date: '2023-05-12',
    content: 'Michael continues to make progress with stress management techniques. Sleep has improved over the past two weeks. Discussed work-related stressors and introduced mindfulness practices.',
    tags: ['Stress', 'Sleep', 'Mindfulness']
  },
  {
    id: 3,
    clientName: 'Jessica Taylor',
    title: 'Follow-up Session',
    date: '2023-05-14',
    content: 'Jessica reports decreased depressive symptoms. Has been consistently using the mood tracking app and completing daily gratitude exercises. Plans to start volunteering next month.',
    tags: ['Depression', 'Recovery', 'Mood Tracking']
  },
  {
    id: 4,
    clientName: 'David Wilson',
    title: 'Initial Assessment',
    date: '2023-05-15',
    content: 'New client seeking support for relationship difficulties. Recently separated from partner of 5 years. Exhibiting signs of adjustment disorder. Focused on establishing rapport and immediate coping strategies.',
    tags: ['Relationships', 'Adjustment', 'Initial']
  }
];

// For the new note form
const clients = [
  { id: 1, name: 'Sarah Johnson' },
  { id: 2, name: 'Michael Chen' },
  { id: 3, name: 'Jessica Taylor' },
  { id: 4, name: 'David Wilson' },
  { id: 5, name: 'Emma Rodriguez' }
];

const SessionNotes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(clientNotes[0]);
  
  const filteredNotes = clientNotes.filter(note => 
    note.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Notes</h2>
          <p className="text-muted-foreground">Record and manage your client session notes.</p>
        </div>
        <Button className="btn-gradient sm:w-auto w-full">
          <Plus className="mr-2 h-4 w-4" /> New Note
        </Button>
      </div>
      
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
              {filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedNote.id === note.id 
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold truncate">{note.title}</h4>
                    <span className="text-xs opacity-80">{note.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <User className="h-3 w-3" />
                    <span>{note.clientName}</span>
                  </div>
                  <p className="text-sm line-clamp-2">
                    {note.content}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {note.tags.map((tag, i) => (
                        <span 
                          key={i}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            selectedNote.id === note.id
                              ? 'bg-white/20'
                              : 'bg-muted'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Note detail/editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Note Details</CardTitle>
            <CardDescription>View and edit session notes</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="view">
              <TabsList className="mb-4">
                <TabsTrigger value="view">View</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              </TabsList>
              
              <TabsContent value="view" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedNote.title}</h2>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" /> 
                      {selectedNote.clientName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> 
                      {selectedNote.date}
                    </div>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <p>{selectedNote.content}</p>
                </div>
                
                {selectedNote.tags.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2 flex items-center gap-1">
                      <Tag className="h-4 w-4" /> Tags
                    </h3>
                    <div className="flex gap-1 flex-wrap">
                      {selectedNote.tags.map((tag, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="edit" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input defaultValue={selectedNote.title} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client</label>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      defaultValue={selectedNote.clientName}
                    >
                      {clients.map(client => (
                        <option key={client.id} value={client.name}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" defaultValue={selectedNote.date} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Note Content</label>
                  <Textarea 
                    rows={12} 
                    defaultValue={selectedNote.content}
                    placeholder="Enter your session notes here..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags (comma separated)</label>
                  <Input defaultValue={selectedNote.tags.join(', ')} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <div className="border border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Paperclip className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop files here or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (PDF, JPG, PNG, DOC up to 10MB)
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline">Cancel</Button>
            <Button className="btn-gradient">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SessionNotes;
