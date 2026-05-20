import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@goldfish/shared/context/AuthContext';
import { internalCmsService, ConversationWithExtraction } from '@/services/internalCmsService';
import { Button } from '@goldfish/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@goldfish/shared/components/ui/card';
import { Badge } from '@goldfish/shared/components/ui/badge';
import { Textarea } from '@goldfish/shared/components/ui/textarea';
import { Skeleton } from '@goldfish/shared/components/ui/skeleton';
import { ScrollArea } from '@goldfish/shared/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@goldfish/shared/components/ui/tabs';
import {
  Brain,
  User,
  Send,
  Wand2,
  RefreshCw,
  Calendar,
  MessageSquare,
  Mail,
  Users,
  FileText,
  Lightbulb,
  Clock,
} from 'lucide-react';
import { useToast } from '@goldfish/shared/hooks/use-toast';
import { BrandChatAvatar } from '@goldfish/shared/components/brand/BrandLogo';
import { useInternalPageHeader } from '@/components/internal/InternalLayoutContext';
import { VariantBadge } from '@/components/internal/VariantBadge';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isInternal } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<ConversationWithExtraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

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

  const formatCompactDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useInternalPageHeader(
    {
      title: conversation
        ? `Session ${conversation.session_id.slice(0, 16)}…`
        : 'Conversation',
      description: conversation ? formatDate(conversation.started_at) : undefined,
      headerActions: conversation ? (
        <Button
          onClick={() => handleExtract(false)}
          disabled={extracting}
          size="sm"
          className="bg-gradient-to-r from-therapy-purple to-therapy-pink hover:opacity-90 text-white"
        >
          {extracting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4 mr-2" />
          )}
          {conversation.extraction ? 'Re-Extract' : 'Extract Data'}
        </Button>
      ) : undefined,
    },
    [conversation, extracting],
  );


  if (!isInternal) return null;

  return (
    <>
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
              <Link to="/">
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
                                {msg.role === 'user' ? (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600" />
                                  </div>
                                ) : (
                                  <BrandChatAvatar bubble="gradient" className="h-8 w-8" />
                                )}
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
                                  {msg.role === 'user' ? (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                      <User className="h-4 w-4 text-gray-600" />
                                    </div>
                                  ) : (
                                    <BrandChatAvatar bubble="gradient" className="h-8 w-8" />
                                  )}
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
                                <BrandChatAvatar bubble="gradient" className="h-8 w-8 animate-pulse" />
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
                      <span className="text-gray-500 shrink-0">A/B variant:</span>
                      <VariantBadge variant={conversation.emailCaptureVariant} />
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

                {conversation.waitlistSubmissions && conversation.waitlistSubmissions.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-gray-800 text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-therapy-purple" />
                        Waitlist Signup
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {conversation.waitlistSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="p-3 bg-gradient-to-br from-therapy-purple/5 to-therapy-pink/5 border border-purple-100 rounded-xl"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="text-gray-800 text-sm font-medium">{submission.name}</p>
                              <a
                                href={`mailto:${submission.email}`}
                                className="text-xs text-therapy-purple hover:underline"
                              >
                                {submission.email}
                              </a>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              {submission.linked_conversation_id === conversation.id ||
                              submission.conversation_id === conversation.id
                                ? 'Linked at signup'
                                : 'Session'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <span>Variant {submission.ab_variant}</span>
                            <span>{submission.page_slug ? `/${submission.page_slug}` : 'Default chat'}</span>
                            <span className="col-span-2">
                              Submitted {formatCompactDate(submission.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Extracted Data Card */}
                {conversation.extraction ? (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-gray-800 text-sm flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-therapy-pink" />
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
                          <Wand2 className="h-4 w-4 mr-2" />
                        )}
                        Extract Data
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
    </>
  );
};

export default ConversationDetail;
