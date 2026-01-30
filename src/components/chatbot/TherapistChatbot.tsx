import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { chatbotService, ChatMessage } from '@/services/chatbotService';
import { Therapist } from '@/types/therapist';
import { Card as TherapistCard, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Check, Briefcase, Users } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { chatbotConversationService, getDeviceInfo, getSessionId } from '@/services/chatbotConversationService';
import { getSelectedModel } from '@/utils/modelConfig';

interface TherapistChatbotProps {
  therapists: Therapist[];
  onTherapistSelect?: (therapist: Therapist) => void;
}

export const TherapistChatbot: React.FC<TherapistChatbotProps> = ({
  therapists,
  onTherapistSelect,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you find a therapist who truly understands you. Let's start by getting to know you a bit. What brings you here today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load device info on mount
  useEffect(() => {
    getDeviceInfo().then(setDeviceInfo);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(
        [...messages, userMessage],
        therapists
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        matchedTherapists: response.matchedTherapists,
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save or update conversation in database
      const modelConfig = getSelectedModel();
      const combinedDeviceInfo = {
        ...deviceInfo,
        ...(response.deviceInfo || {}), // Merge server-side device info
      };
      
      const savedId = await chatbotConversationService.saveConversation(
        updatedMessages,
        modelConfig,
        combinedDeviceInfo,
        conversationId // Pass existing conversation ID to update instead of creating new
      );
      
      if (savedId && !conversationId) {
        setConversationId(savedId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Could you please try again?",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Model Selector (Dev Mode Only) */}
      <div className="px-4 pt-4">
        <ModelSelector />
      </div>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="space-y-3">
              <div
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <Card
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </Card>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
              
              {/* Show therapist cards inline with assistant messages */}
              {message.role === 'assistant' && message.matchedTherapists && message.matchedTherapists.length > 0 && (
                <div className="flex gap-3 justify-start pl-11">
                  <div className="max-w-[80%] w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {message.matchedTherapists.map((therapist) => (
                        <TherapistCard
                          key={therapist.id}
                          className="overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => onTherapistSelect?.(therapist)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex gap-3">
                              <img
                                src={therapist.profileImage}
                                alt={`${therapist.firstName} ${therapist.lastName}`}
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base">
                                  {therapist.firstName} {therapist.lastName}
                                </CardTitle>
                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {therapist.location}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span className="text-xs ml-1">{therapist.rating}</span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pb-2">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {therapist.specialties.slice(0, 2).map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{therapist.bio}</p>
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Briefcase className="h-3 w-3 mr-1" />
                                {therapist.yearsOfExperience} yrs
                              </span>
                              {therapist.acceptingNewClients && (
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs px-1.5 py-0">
                                  <Check className="h-3 w-3 mr-1" />
                                  Accepting
                                </Badge>
                              )}
                            </div>
                          </CardContent>

                          <CardFooter className="pt-2 pb-3 border-t">
                            <Button size="sm" className="w-full text-xs">Connect</Button>
                          </CardFooter>
                        </TherapistCard>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <Card className="bg-gray-100">
                <div className="p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 bg-white flex-shrink-0">
        <div className="flex gap-2 items-center">
          {messages.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const modelConfig = getSelectedModel();
                const conversation = {
                  id: conversationId || undefined,
                  session_id: getSessionId(),
                  model_provider: modelConfig.provider,
                  model_id: modelConfig.modelId,
                  conversation_data: messages,
                  device_info: deviceInfo,
                  started_at: new Date().toISOString(),
                };
                chatbotConversationService.downloadCSV(conversation);
              }}
              className="mr-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
