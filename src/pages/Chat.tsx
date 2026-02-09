import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Bot, User, Download, Settings, Sparkles, ArrowUp, LogOut, LayoutDashboard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { chatbotService, ChatMessage } from '@/services/chatbotService';
import { ModelSelector } from '@/components/chatbot/ModelSelector';
import { PromptEditor, getInitialGreetingWithVersion } from '@/components/chatbot/PromptEditor';
import { chatbotConversationService, getDeviceInfo, getSessionId } from '@/services/chatbotConversationService';
import { getSelectedModel } from '@/utils/modelConfig';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';

const Chat = () => {
  const { id: urlConversationId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(urlConversationId || null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [promptVersion, setPromptVersion] = useState<number | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  
  // Read page slug from URL params (e.g. ?page=sleep)
  const pageSlug = searchParams.get('page') || undefined;
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track if we've already sent the initial message
  const initialMessageSentRef = useRef(false);

  // Initialize: load greeting, device info, and restore conversation if ID provided
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load prompt version and device info
        const { version } = await getInitialGreetingWithVersion();
        setPromptVersion(version);
        
        const info = await getDeviceInfo();
        setDeviceInfo(info);

        // If we have a conversation ID, try to load it
        if (urlConversationId) {
          const savedConversation = await chatbotConversationService.getConversation(urlConversationId);
          if (savedConversation && savedConversation.conversation_data) {
            setMessages(savedConversation.conversation_data);
            setConversationId(urlConversationId);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initialize();
  }, [urlConversationId]);

  // Send initial message from URL params after initialization
  useEffect(() => {
    const initialMessage = searchParams.get('message');
    if (
      initialMessage && 
      !isInitializing && 
      messages.length === 0 && 
      !initialMessageSentRef.current
    ) {
      initialMessageSentRef.current = true;
      sendInitialMessage(initialMessage);
    }
  }, [isInitializing, messages.length, searchParams]);

  const sendInitialMessage = async (messageContent: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
    };

    setMessages([userMessage]);
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage([userMessage], undefined, pageSlug);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
      };

      const updatedMessages = [userMessage, assistantMessage];
      setMessages(updatedMessages);

      const modelConfig = getSelectedModel();
      const combinedDeviceInfo = {
        ...deviceInfo,
        ...(response.deviceInfo || {}),
      };
      
      const savedId = await chatbotConversationService.saveConversation(
        updatedMessages,
        modelConfig,
        combinedDeviceInfo,
        null
      );
      
      if (savedId) {
        setConversationId(savedId);
        const pageParam = pageSlug ? `?page=${pageSlug}` : '';
        navigate(`/chat/${savedId}${pageParam}`, { replace: true });
      }
    } catch (error) {
      console.error('Error sending initial message:', error);
      const errorText = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages([userMessage, {
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errorText}. Please try again.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      scrollToLatestMessage();
    }
  }, [messages]);

  const scrollToLatestMessage = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    textareaRef.current?.focus();

    try {
      const response = await chatbotService.sendMessage([...messages, userMessage], undefined, pageSlug);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      const modelConfig = getSelectedModel();
      const combinedDeviceInfo = {
        ...deviceInfo,
        ...(response.deviceInfo || {}),
      };
      
      const savedId = await chatbotConversationService.saveConversation(
        updatedMessages,
        modelConfig,
        combinedDeviceInfo,
        conversationId
      );
      
      if (savedId && !conversationId) {
        setConversationId(savedId);
        // Update URL to include conversation ID without navigation
        const pageParam = pageSlug ? `?page=${pageSlug}` : '';
        navigate(`/chat/${savedId}${pageParam}`, { replace: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorText = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errorText}. Please try again.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-therapy-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Header */}
      <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">Goldfish</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <ModelSelector compact />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPromptEditor(true)}
                  title="Edit Prompt"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {messages.length > 1 && (
                  <>
                    {conversationId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View Report"
                        onClick={() => navigate(`/chat/${conversationId}/report${pageSlug ? `?page=${pageSlug}` : ''}`)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Export CSV"
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
                          prompt_version: promptVersion ?? undefined,
                        };
                        chatbotConversationService.downloadCSV(conversation);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-therapy-purple text-white text-sm">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-gray-600">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild className="bg-therapy-purple hover:bg-therapy-purple/90">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 min-h-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-therapy-purple/20 to-therapy-pink/20 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-therapy-purple" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Start your conversation</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Tell us what you're looking for in a therapist, and we'll help match you with the right professional.
                  </p>
                </div>
              )}
              
              {messages.map((message, index) => {
                const isLastMessage = index === messages.length - 1;
                return (
                <div 
                  key={index} 
                  className="space-y-3"
                  ref={isLastMessage ? lastMessageRef : undefined}
                >
                  <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <Card className={`max-w-[80%] shadow-sm ${
                      message.role === 'user'
                        ? 'bg-therapy-purple text-white'
                        : 'bg-white/90 backdrop-blur-sm'
                    }`}>
                      <div className={`p-4 ${message.role === 'assistant' ? 'prose prose-sm max-w-none' : ''}`}>
                        {message.role === 'assistant' ? (
                          <ReactMarkdown
                            className="text-sm markdown-content text-gray-700"
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              a: ({ href, children }) => (
                                <a href={href} className="text-therapy-purple underline hover:text-therapy-pink" target="_blank" rel="noopener noreferrer">
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </Card>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                </div>
              );
              })}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <Card className="bg-white/90 backdrop-blur-sm shadow-sm">
                    <div className="p-4">
                      <Loader2 className="h-4 w-4 animate-spin text-therapy-purple" />
                    </div>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 pb-safe flex-shrink-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="max-w-3xl mx-auto">
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                <div className="p-4">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="min-h-[52px] max-h-[150px] resize-none border-0 bg-transparent text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 pr-14"
                      rows={1}
                      style={{ height: 'auto', minHeight: '52px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                      }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                      className="absolute bottom-1 right-1 h-10 w-10 rounded-xl bg-therapy-purple hover:bg-therapy-purple/90 shadow-md transition-all disabled:opacity-40"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Editor Dialog */}
      <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chatbot Prompt</DialogTitle>
          </DialogHeader>
          <PromptEditor open={showPromptEditor} onOpenChange={setShowPromptEditor} pageSlug={pageSlug || 'default'} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
