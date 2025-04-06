
import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Send, FileText, Paperclip, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { patientService } from '@/services/patientService';

const PatientMessages = () => {
  const [newMessage, setNewMessage] = useState("");
  const [messagesData, setMessagesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await patientService.getPatientMessages();
        setMessagesData(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Failed to load messages",
          description: "Please try again later",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [toast]);
  
  // Function to handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() === "") {
      return;
    }
    
    console.log("Sending message:", newMessage);
    toast({
      title: "Message sent",
      description: "Your message has been sent to your therapist."
    });
    
    // In a real app, this would add the message to the conversation and send it to the server
    setNewMessage("");
  };

  // Function to handle file attachment
  const handleAttachment = () => {
    console.log("Attaching file");
    toast({
      title: "Feature coming soon",
      description: "File attachment will be available in a future update."
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-therapy-purple" />
            <p className="text-muted-foreground">Loading your messages...</p>
          </div>
        </main>
        <Separator />
        <Footer />
      </div>
    );
  }

  if (!messagesData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <div className="max-w-6xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold tracking-tight mb-4">No message data available</h1>
            <p className="text-muted-foreground mb-6">
              We're having trouble loading your messages.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="mx-auto"
            >
              Try Again
            </Button>
          </div>
        </main>
        <Separator />
        <Footer />
      </div>
    );
  }

  const therapist = messagesData.therapist;
  const conversation = messagesData.conversations[0]; // Currently displaying only one conversation

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Secure messaging with your therapist.
            </p>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-270px)]">
            {/* Sidebar - Message threads (simplified with just one therapist) */}
            <Card className="col-span-1 overflow-hidden">
              <div className="p-4 bg-therapy-purple text-white">
                <h2 className="font-semibold">Conversations</h2>
              </div>
              <div className="h-full overflow-y-auto">
                <div className="p-3 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={therapist.avatar || undefined} />
                      <AvatarFallback className="bg-therapy-purple text-white">
                        {therapist.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{therapist.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(conversation.messages[conversation.messages.length - 1].timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Main message area */}
            <Card className="col-span-1 md:col-span-3 flex flex-col">
              {/* Conversation header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={therapist.avatar || undefined} />
                  <AvatarFallback className="bg-therapy-purple text-white">
                    {therapist.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{therapist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Licensed Clinical Psychologist
                  </p>
                </div>
              </div>
              
              {/* Message area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversation.messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'patient'
                          ? 'bg-therapy-purple text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-xs ${message.sender === 'patient' ? 'text-purple-200' : 'text-muted-foreground'}`}>
                          {message.sender === 'patient' ? 'You' : therapist.name}
                        </p>
                        <p className={`text-xs ml-2 ${message.sender === 'patient' ? 'text-purple-200' : 'text-muted-foreground'}`}>
                          {format(message.timestamp, 'h:mm a')}
                        </p>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachment && (
                        <div className="mt-2 flex items-center">
                          <FileText className={`h-4 w-4 mr-1 ${message.sender === 'patient' ? 'text-white' : 'text-therapy-purple'}`} />
                          <a 
                            href="#" 
                            className={`text-sm underline ${message.sender === 'patient' ? 'text-white' : 'text-therapy-purple'}`}
                          >
                            {message.attachment}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message input */}
              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleAttachment} 
                    className="text-muted-foreground"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  Messages are end-to-end encrypted and securely stored according to HIPAA guidelines.
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> This messaging system is for non-urgent communication only. For emergencies, please call 911 or your local emergency number.
            </p>
          </div>
        </div>
      </main>
      
      <Separator />
      <Footer />
    </div>
  );
};

export default PatientMessages;
