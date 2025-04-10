
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, Send, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { encryptAES, decryptAES } from '@/lib/utils';
import { getRelativeTimeString } from '@/utils/dateUtils';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/services/clientService';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

interface Client {
  id: number;
  client_profile: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

const TherapistMessages = () => {
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get encryption key based on user ID or use a default (should be stored securely in production)
  const encryptionKey = user?.id ? `${user.id}-messaging-key` : 'default-therapy-key-change-in-production';

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!user) return [];
      return await clientService.getClients(user.id);
    },
    enabled: !!user,
  });

  // Filtered clients based on search
  const filteredClients = clients?.filter(client => {
    const fullName = `${client.client_profile.first_name} ${client.client_profile.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  useEffect(() => {
    if (selectedClient) {
      loadMessages(selectedClient.client_profile.id);
    }
  }, [selectedClient]);

  const loadMessages = async (clientId: string) => {
    if (!user || !clientId) return;
    
    setLoading(true);
    try {
      // Fetch messages where either the therapist is the sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .and(`sender_id.eq.${clientId},receiver_id.eq.${clientId}`)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Decrypt the messages
      const decryptedMessages = data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: decryptAES(msg.content, encryptionKey),
        timestamp: msg.created_at,
        isFromUser: msg.sender_id === user.id,
      }));
      
      setMessages(decryptedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "We couldn't load your messages. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedClient || !user) return;
    
    try {
      // Encrypt the message content
      const encryptedContent = encryptAES(message, encryptionKey);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedClient.client_profile.id,
          content: encryptedContent,
          is_from_user: true
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Add the decrypted message to the UI
      const newMessage: Message = {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        content: message, // Use the original unencrypted message for display
        timestamp: data.created_at,
        isFromUser: true
      };
      
      setMessages([...messages, newMessage]);
      setMessage('');
      
      toast({
        title: "Message sent",
        description: "Your encrypted message has been sent to the client.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    return getRelativeTimeString(timestamp);
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        <p className="text-muted-foreground">
          Communicate securely with your clients
        </p>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        {/* Client list */}
        <Card className="lg:col-span-1 h-[calc(100vh-250px)] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle>Clients</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                className="pl-8" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-2">
            {filteredClients && filteredClients.length > 0 ? (
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div 
                    key={client.id}
                    className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                      selectedClient?.id === client.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {client.client_profile.first_name} {client.client_profile.last_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No clients found</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Messages */}
        <Card className="lg:col-span-3 h-[calc(100vh-250px)] flex flex-col">
          {selectedClient ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {selectedClient.client_profile.first_name} {selectedClient.client_profile.last_name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-auto p-4 flex flex-col">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.isFromUser 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.isFromUser ? 'text-gray-200' : 'text-gray-500'}`}>
                            {formatMessageTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start a new conversation with this client
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4 flex gap-2">
                  <Textarea
                    placeholder="Type your message here..."
                    className="flex-1 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Select a client</h3>
                <p className="text-muted-foreground">
                  Choose a client from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TherapistMessages;
