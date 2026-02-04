import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Send, Loader2, Bot, User, Download, Settings, Sparkles, ArrowUp, LogOut, LayoutDashboard, Heart, CheckCircle2 } from 'lucide-react';
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
import { therapistDiscoveryService } from '@/services/therapistDiscoveryService';
import { ModelSelector } from '@/components/chatbot/ModelSelector';
import { PromptEditor, getInitialGreetingWithVersion } from '@/components/chatbot/PromptEditor';
import { chatbotConversationService, getDeviceInfo, getSessionId } from '@/services/chatbotConversationService';
import { getSelectedModel } from '@/utils/modelConfig';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';

// Animated placeholder prompts
const PLACEHOLDER_PROMPTS = [
  "I'm feeling anxious about work and need help managing stress...",
  "I want to find a therapist who specializes in relationship issues...",
  "I'm looking for someone who understands depression and can help...",
  "I need a therapist who works with LGBTQ+ clients...",
  "I'm struggling with grief after losing a loved one...",
  "I want to work on my self-esteem and confidence...",
  "I need help dealing with trauma from my past...",
  "I'm looking for couples therapy to improve my relationship...",
];

const Index = () => {
  const { user, signOut } = useAuth();
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [promptVersion, setPromptVersion] = useState<number | null>(null);
  const [showDevMode, setShowDevMode] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  
  // Animated placeholder state
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch therapists
  const { data: therapists, isLoading: isLoadingTherapists } = useQuery({
    queryKey: ['therapists'],
    queryFn: therapistDiscoveryService.getAllTherapists,
  });

  // Animated placeholder effect
  useEffect(() => {
    if (hasStartedChat) return;
    
    const currentPrompt = PLACEHOLDER_PROMPTS[placeholderIndex];
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    if (isTyping) {
      // Typing animation
      const typeChar = () => {
        if (charIndex <= currentPrompt.length) {
          setDisplayedPlaceholder(currentPrompt.slice(0, charIndex));
          charIndex++;
          timeoutId = setTimeout(typeChar, 40);
        } else {
          // Pause at end of typing
          timeoutId = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      };
      typeChar();
    } else {
      // Deleting animation
      let deleteIndex = currentPrompt.length;
      const deleteChar = () => {
        if (deleteIndex >= 0) {
          setDisplayedPlaceholder(currentPrompt.slice(0, deleteIndex));
          deleteIndex--;
          timeoutId = setTimeout(deleteChar, 20);
        } else {
          // Move to next prompt
          setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
          setIsTyping(true);
        }
      };
      deleteChar();
    }
    
    return () => clearTimeout(timeoutId);
  }, [placeholderIndex, isTyping, hasStartedChat]);

  // Initialize prompt version and device info
  useEffect(() => {
    const initialize = async () => {
      try {
        const { version } = await getInitialGreetingWithVersion();
        setPromptVersion(version);
        
        const info = await getDeviceInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error('Error initializing:', error);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (hasStartedChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasStartedChat]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !therapists) return;

    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    textareaRef.current?.focus();

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

  // Landing page with chat input
  if (!hasStartedChat) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-3xl" />
        
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="w-full py-6 px-4">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Goldfish</span>
              </div>
              
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDevMode(!showDevMode)}
                      className="text-gray-600"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showDevMode ? 'Hide' : 'Dev'}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-therapy-purple text-white">
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
                    <Button variant="ghost" asChild className="text-gray-600">
                      <Link to="/login">Log in</Link>
                    </Button>
                    <Button asChild className="bg-therapy-purple hover:bg-therapy-purple/90">
                      <Link to="/signup">Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Dev Mode Panel */}
          {showDevMode && user && (
            <div className="max-w-6xl mx-auto px-4 mb-4">
              <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-amber-900">Developer Mode</h3>
                    <p className="text-sm text-amber-700">Configure the AI model and prompt</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ModelSelector compact />
                    <Button variant="outline" size="sm" onClick={() => setShowPromptEditor(true)}>
                      Edit Prompt
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-gray-800 mb-6 leading-tight tracking-tight">
                Find Your Path to
                <br />
                <span className="italic text-therapy-purple">Mental Wellness</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Connect with the right therapist for you. Our AI assistant helps match you with mental health professionals who understand your unique needs.
              </p>
            </div>

            {/* Chat input card */}
            <div className="w-full max-w-2xl">
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
                <div className="p-6">
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={displayedPlaceholder || "Tell us what you're looking for..."}
                      disabled={isLoading || isLoadingTherapists}
                      className="min-h-[120px] resize-none border-0 bg-transparent text-lg placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 pr-14"
                      style={{ fontSize: '17px', lineHeight: '1.6' }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim() || isLoadingTherapists}
                      size="icon"
                      className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-therapy-purple hover:bg-therapy-purple/90 shadow-lg"
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
          </main>

          {/* Footer */}
          <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 text-center">
            <p className="text-sm text-gray-500">
              Your conversations are private and secure
            </p>
          </footer>
        </div>

        {/* Prompt Editor Dialog */}
        <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Chatbot Prompt</DialogTitle>
            </DialogHeader>
            <PromptEditor open={showPromptEditor} onOpenChange={setShowPromptEditor} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full chat view
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-800">Goldfish</span>
          </div>
          
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
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <div key={index} className="space-y-3">
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
                  
                  {/* Match Found CTA */}
                  {message.role === 'assistant' && message.matchedTherapists && message.matchedTherapists.length > 0 && (
                    <div className="flex gap-3 justify-start pl-11">
                      <div className="max-w-[90%] w-full">
                        <Card className="overflow-hidden bg-gradient-to-br from-therapy-purple/5 via-white to-therapy-pink/5 border-2 border-therapy-purple/20 shadow-lg">
                          <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center shadow-lg">
                              <Heart className="h-8 w-8 text-white" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              Great news! We found your perfect match{message.matchedTherapists.length > 1 ? 'es' : ''}
                            </h3>
                            
                            <p className="text-gray-600 mb-4 max-w-md mx-auto">
                              Based on everything you've shared, we've identified {message.matchedTherapists.length} therapist{message.matchedTherapists.length > 1 ? 's' : ''} who {message.matchedTherapists.length > 1 ? 'are' : 'is'} a great fit for your needs.
                            </p>
                            
                            <div className="flex flex-wrap justify-center gap-3 mb-6">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Matched to your preferences</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Accepting new clients</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Verified professionals</span>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <Button 
                                asChild
                                size="lg" 
                                className="w-full sm:w-auto px-8 bg-gradient-to-r from-therapy-purple to-therapy-pink hover:opacity-90 text-white shadow-md"
                              >
                                <Link to="/signup">
                                  Sign Up to Connect
                                  <ArrowUp className="ml-2 h-4 w-4 rotate-45" />
                                </Link>
                              </Button>
                              
                              <p className="text-xs text-gray-500">
                                Free to join • No commitment required
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
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
          <div className="p-4">
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
          <PromptEditor open={showPromptEditor} onOpenChange={setShowPromptEditor} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
