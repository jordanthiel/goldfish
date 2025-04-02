
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Send, FileText, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Demo messages data
const messagesData = {
  therapist: {
    id: 1,
    name: "Dr. Amy Johnson",
    avatar: null,
    initials: "AJ"
  },
  conversations: [
    {
      id: 1,
      messages: [
        {
          id: 1,
          sender: "therapist",
          content: "Hello Michael, I hope you're doing well today. I wanted to check in on how you've been managing the stress reduction techniques we discussed in our last session.",
          timestamp: new Date("2023-09-30T10:30:00"),
          read: true
        },
        {
          id: 2,
          sender: "patient",
          content: "Hi Dr. Johnson, I've been practicing the breathing exercises daily and they're definitely helping. I still struggle during high-stress meetings at work, but it's getting better.",
          timestamp: new Date("2023-09-30T14:45:00"),
          read: true
        },
        {
          id: 3,
          sender: "therapist",
          content: "That's great progress, Michael! It's normal for the techniques to be more challenging in high-stress situations. Try using the 5-4-3-2-1 grounding technique we discussed when you feel anxiety building up during meetings.",
          timestamp: new Date("2023-09-30T15:20:00"),
          read: true
        },
        {
          id: 4,
          sender: "therapist",
          content: "I'm also attaching a handout on mindfulness practices that might be helpful for you to review before our next session.",
          timestamp: new Date("2023-09-30T15:22:00"),
          read: true,
          attachment: "Mindfulness_Practices.pdf"
        },
        {
          id: 5,
          sender: "patient",
          content: "Thank you, I'll definitely try that technique! And thanks for the handout, I'll review it before our next appointment.",
          timestamp: new Date("2023-09-30T16:10:00"),
          read: true
        },
        {
          id: 6,
          sender: "therapist",
          content: "You're welcome! Looking forward to our session next week. Don't hesitate to message me if you have any questions before then.",
          timestamp: new Date("2023-09-30T16:15:00"),
          read: true
        },
        {
          id: 7,
          sender: "patient",
          content: "Quick question - do you have any recommendations for sleep issues? I've been having trouble falling asleep lately.",
          timestamp: new Date("2023-10-02T21:30:00"),
          read: true
        },
        {
          id: 8,
          sender: "therapist",
          content: "Sleep difficulties are common with anxiety. Try establishing a wind-down routine 30-60 minutes before bed (no screens, dim lights, possibly reading or light stretching). Also, the body scan relaxation technique we practiced can be helpful. We can discuss more specific strategies in our next session.",
          timestamp: new Date("2023-10-03T09:15:00"),
          read: false
        }
      ]
    }
  ]
};

const PatientMessages = () => {
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const conversation = messagesData.conversations[0]; // Currently displaying only one conversation
  const therapist = messagesData.therapist;
  
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
