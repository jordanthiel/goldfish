import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { internalCmsService, ConversationWithExtraction } from '@/services/internalCmsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Brain,
  User,
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Calendar,
  MessageSquare,
  Mail,
  Users,
  FileText,
  Lightbulb,
  Clock,
  LayoutDashboard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isInternal, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<ConversationWithExtraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isInternal) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have access to the internal dashboard.',
        variant: 'destructive',
      });
    }
  }, [authLoading, isInternal, navigate, toast]);

  useEffect(() => {
    if (isInternal && id) {
      loadConversation();
    }
  }, [isInternal, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadConversation = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await internalCmsService.getConversation(id);
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async (forceReExtract: boolean = false) => {
    if (!id) return;
    setExtracting(true);
    try {
      const result = await internalCmsService.extractConversation(id, forceReExtract);
      if (result.error) {
        toast({
          title: 'Extraction Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: result.cached ? 'Extraction Retrieved' : 'Extraction Complete',
          description: result.cached
            ? 'Loaded existing extraction from cache.'
            : 'Successfully extracted conversation data.',
        });
        loadConversation();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to extract conversation.',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !id) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const allMessages = [...chatMessages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await internalCmsService.chatWithGemini(allMessages, 'specific', id);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.message,
          timestamp: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message.',
        variant: 'destructive',
      });
    } finally {
      setChatLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple" />
      </div>
    );
  }

  if (!isInternal) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full py-4 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/internal">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Conversation Analysis</h1>
                  <p className="text-xs text-gray-500 font-mono">
                    {conversation?.session_id.slice(0, 24) || '...'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleExtract(false)}
                disabled={extracting}
                className="bg-gradient-to-r from-therapy-purple to-therapy-pink hover:opacity-90 text-white"
              >
                {extracting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {conversation?.extraction ? 'Re-Extract' : 'Extract Data'}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-96" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            </div>
          ) : !conversation ? (
            <div className="text-center py-16">
              <p className="text-gray-500">Conversation not found.</p>
              <Link to="/internal">
                <Button variant="link" className="text-therapy-purple mt-4">
                  Go back to dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="chat" className="w-full">
                  <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-100">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-therapy-purple/10 data-[state=active]:text-therapy-purple">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Original Chat
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="data-[state=active]:bg-therapy-pink/10 data-[state=active]:text-therapy-pink">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Analysis
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="mt-4">
                    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-therapy-purple" />
                          Conversation Transcript
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          {conversation.conversation_data?.length || 0} messages
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-4">
                            {(conversation.conversation_data || []).map((msg, idx) => (
                              <div
                                key={idx}
                                className={`flex gap-3 ${
                                  msg.role === 'user' ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                    msg.role === 'user'
                                      ? 'bg-gray-200'
                                      : 'bg-gradient-to-br from-therapy-purple to-therapy-pink'
                                  }`}
                                >
                                  {msg.role === 'user' ? (
                                    <User className="h-4 w-4 text-gray-600" />
                                  ) : (
                                    <Bot className="h-4 w-4 text-white" />
                                  )}
                                </div>
                                <div
                                  className={`flex-1 p-4 rounded-2xl ${
                                    msg.role === 'user'
                                      ? 'bg-therapy-purple text-white'
                                      : 'bg-white border border-gray-100 shadow-sm'
                                  }`}
                                >
                                  <p className={`text-sm whitespace-pre-wrap ${msg.role === 'user' ? '' : 'text-gray-700'}`}>
                                    {msg.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analysis" className="mt-4">
                    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          <Brain className="h-5 w-5 text-therapy-pink" />
                          Ask About This Conversation
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                          Chat with AI to get insights about this conversation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] pr-4 mb-4">
                          <div className="space-y-4">
                            {chatMessages.length === 0 ? (
                              <div className="text-center py-8">
                                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">
                                  Ask questions about this conversation
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                  {[
                                    'What are the main concerns?',
                                    'Summarize this conversation',
                                    'What therapy approach would help?',
                                    'Are there any red flags?',
                                  ].map((suggestion) => (
                                    <Button
                                      key={suggestion}
                                      variant="outline"
                                      size="sm"
                                      className="border-gray-200 text-gray-600 text-xs hover:bg-purple-50 hover:border-therapy-purple hover:text-therapy-purple"
                                      onClick={() => setChatInput(suggestion)}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              chatMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className={`flex gap-3 ${
                                    msg.role === 'user' ? 'flex-row-reverse' : ''
                                  }`}
                                >
                                  <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                      msg.role === 'user'
                                        ? 'bg-gray-200'
                                        : 'bg-gradient-to-br from-therapy-purple to-therapy-pink'
                                    }`}
                                  >
                                    {msg.role === 'user' ? (
                                      <User className="h-4 w-4 text-gray-600" />
                                    ) : (
                                      <Sparkles className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  <div
                                    className={`flex-1 p-4 rounded-2xl ${
                                      msg.role === 'user'
                                        ? 'bg-therapy-purple text-white'
                                        : 'bg-gradient-to-br from-therapy-purple/5 to-therapy-pink/5 border border-purple-100'
                                    }`}
                                  >
                                    <p className={`text-sm whitespace-pre-wrap ${msg.role === 'user' ? '' : 'text-gray-700'}`}>
                                      {msg.content}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                            {chatLoading && (
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                                </div>
                                <div className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-therapy-purple/5 to-therapy-pink/5 border border-purple-100">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-therapy-purple animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-therapy-purple animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 rounded-full bg-therapy-purple animate-bounce" style={{ animationDelay: '0.2s' }} />
                                  </div>
                                </div>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        </ScrollArea>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Ask about this conversation..."
                            className="bg-white border-gray-200 resize-none"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChat();
                              }
                            }}
                          />
                          <Button
                            onClick={handleSendChat}
                            disabled={chatLoading || !chatInput.trim()}
                            className="bg-gradient-to-r from-therapy-purple to-therapy-pink hover:opacity-90 text-white"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Metadata Card */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-gray-800 text-sm">Conversation Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conversation.profile && (
                      <div className="p-3 bg-gradient-to-br from-therapy-purple/10 to-therapy-pink/10 border border-purple-100 rounded-xl mb-3">
                        <div className="flex items-center gap-2 text-therapy-purple text-xs mb-1">
                          <User className="h-3 w-3" />
                          Logged-in User
                        </div>
                        <p className="text-gray-800 text-sm font-medium">
                          {conversation.profile.full_name || 'No name'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {conversation.profile.email}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Started:</span>
                      <span className="text-gray-700">{formatDate(conversation.started_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Model:</span>
                      <Badge variant="outline" className="border-gray-200 text-gray-600">
                        {conversation.model_id}
                      </Badge>
                    </div>
                    {conversation.device_info && (
                      <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="truncate">{conversation.device_info.user_agent?.slice(0, 50)}...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Extracted Data Card */}
                {conversation.extraction ? (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-gray-800 text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-therapy-pink" />
                        Extracted Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                            <User className="h-3 w-3" />
                            Name
                          </div>
                          <p className="text-gray-700 text-sm font-medium">
                            {conversation.extraction.extracted_name || 'Unknown'}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                            <Users className="h-3 w-3" />
                            Age
                          </div>
                          <p className="text-gray-700 text-sm font-medium">
                            {conversation.extraction.extracted_age || 'Unknown'}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                            <Users className="h-3 w-3" />
                            Gender
                          </div>
                          <p className="text-gray-700 text-sm font-medium">
                            {conversation.extraction.extracted_gender || 'Unknown'}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </div>
                          <p className="text-gray-700 text-sm font-medium truncate">
                            {conversation.extraction.extracted_email || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                            <FileText className="h-3 w-3" />
                            Case Summary
                          </div>
                          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-xl">
                            {conversation.extraction.case_summary}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                            <Lightbulb className="h-3 w-3" />
                            Recommendation
                          </div>
                          <p className="text-gray-700 text-sm bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-3 rounded-xl">
                            {conversation.extraction.recommendation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                    <CardContent className="py-8 text-center">
                      <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        No extraction available yet.
                      </p>
                      <Button
                        onClick={() => handleExtract(false)}
                        disabled={extracting}
                        className="bg-gradient-to-r from-therapy-purple to-therapy-pink hover:opacity-90 text-white"
                      >
                        {extracting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Extract Data
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ConversationDetail;
