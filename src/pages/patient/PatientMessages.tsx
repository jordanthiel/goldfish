import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, User } from 'lucide-react';
import { patientService, Message } from '@/services/patientService';
import { useAuth } from '@/context/AuthContext';
import { encryptAES, decryptAES } from '@/lib/utils';
import { formatDate } from '@/utils/dateUtils';

const PatientMessages = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const encryptionKey = user?.id ? `${user.id}-messaging-key` : 'default-therapy-key-change-in-production';

  useEffect(() => {
    const loadPatientProfile = async () => {
      if (user) {
        try {
          const patientData = await patientService.getPatientProfile();
          setPatient(patientData);
          
          const encryptedMessages = await patientService.getMessages(patientData.id);
          
          const decryptedMessages = encryptedMessages.map(msg => ({
            ...msg,
            content: decryptAES(msg.content, encryptionKey)
          }));
          
          setMessages(decryptedMessages);
        } catch (error) {
          console.error('Error loading patient profile:', error);
          toast({
            title: "Error loading messages",
            description: "We couldn't load your messages. Please try again later.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadPatientProfile();
  }, [user, toast, encryptionKey]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !patient) return;
    
    try {
      const encryptedContent = encryptAES(message, encryptionKey);
      
      const messageToSend = {
        senderId: user?.id || '',
        receiverId: 'therapist',
        content: encryptedContent,
        isFromUser: true
      };
      
      const sentMessage = await patientService.sendMessage(patient.id, messageToSend);
      
      const newMessage: Message = {
        ...sentMessage,
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      setMessages([...messages, newMessage]);
      setMessage('');
      
      toast({
        title: "Message sent",
        description: "Your encrypted message has been sent to your therapist.",
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
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    return `${formatDate(timestamp)} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Communicate securely with your therapist between sessions
            </p>
          </div>
          
          <Card className="flex flex-col h-[calc(100vh-220px)]">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Therapist
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-auto p-4 flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <p>Loading messages...</p>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.isFromUser 
                            ? 'bg-therapy-purple text-white' 
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
                      Send your first encrypted message to start a secure conversation with your therapist.
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
          </Card>
        </div>
      </main>
      <Separator />
      <Footer />
    </div>
  );
};

export default PatientMessages;
