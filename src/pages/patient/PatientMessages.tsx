
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, User } from 'lucide-react';

// This is a stub implementation until proper messaging is implemented
const PatientMessages = () => {
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    toast({
      title: "Feature in development",
      description: "Messaging functionality is coming soon!",
    });
    
    setMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with your therapist between sessions
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
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Send your first message to start a conversation with your therapist.
                  </p>
                </div>
              </div>
              
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
                <Button onClick={handleSendMessage}>
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
