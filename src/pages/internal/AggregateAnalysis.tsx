import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { internalCmsService, AggregateStats } from '@/services/internalCmsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Brain,
  User,
  Send,
  Wand2,
  MessageSquare,
  Users,
  TrendingUp,
  PieChart,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const AggregateAnalysis: React.FC = () => {
  const { isInternal, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (isInternal) {
      loadStats();
    }
  }, [isInternal]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await internalCmsService.getAggregateStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load statistics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

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

      const result = await internalCmsService.chatWithGemini(allMessages, 'aggregate');

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

  const getGenderColor = (gender: string) => {
    const colors: Record<string, string> = {
      male: 'bg-blue-500',
      female: 'bg-pink-500',
      'non-binary': 'bg-purple-500',
      other: 'bg-amber-500',
    };
    return colors[gender.toLowerCase()] || 'bg-gray-400';
  };

  const getTotalGenderCount = () => {
    if (!stats?.genderBreakdown) return 0;
    return Object.values(stats.genderBreakdown).reduce((a, b) => a + b, 0);
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
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Aggregate Analysis</h1>
                  <p className="text-xs text-gray-500">Ask questions about all conversations</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Panel */}
            <div className="space-y-6">
              {/* Overview Stats */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-gray-800 text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-therapy-purple" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-gradient-to-br from-therapy-purple/5 to-therapy-pink/5 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500 text-sm">Total Conversations</span>
                          <MessageSquare className="h-4 w-4 text-therapy-purple" />
                        </div>
                        <p className="text-3xl font-bold text-therapy-purple">
                          {stats?.totalConversations || 0}
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-therapy-pink/5 to-purple-50 rounded-xl border border-pink-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500 text-sm">Analyzed</span>
                          <Brain className="h-4 w-4 text-therapy-pink" />
                        </div>
                        <p className="text-3xl font-bold text-therapy-pink">
                          {stats?.extractedConversations || 0}
                        </p>
                        <Progress
                          value={
                            stats?.totalConversations
                              ? ((stats.extractedConversations || 0) / stats.totalConversations) * 100
                              : 0
                          }
                          className="mt-2 h-2 bg-gray-100"
                        />
                      </div>

                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500 text-sm">Last 7 Days</span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                          {stats?.recentConversations || 0}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Demographics */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-gray-800 text-sm flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-therapy-pink" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <Skeleton className="h-32" />
                  ) : (
                    <>
                      {/* Gender Breakdown */}
                      <div>
                        <p className="text-gray-400 text-xs mb-3 flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Gender Distribution
                        </p>
                        {getTotalGenderCount() > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(stats?.genderBreakdown || {}).map(([gender, count]) => (
                              <div key={gender} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700 capitalize">{gender}</span>
                                  <span className="text-gray-500">{count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getGenderColor(gender)} transition-all`}
                                    style={{
                                      width: `${(count / getTotalGenderCount()) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No gender data available</p>
                        )}
                      </div>

                      {/* Age Range */}
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-gray-400 text-xs mb-3">Age Range</p>
                        {stats?.ageBreakdown ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                              <p className="text-gray-400 text-xs">Min</p>
                              <p className="text-lg font-bold text-gray-700">
                                {stats.ageBreakdown.min}
                              </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-therapy-purple/10 to-therapy-pink/10 rounded-xl text-center border border-purple-100">
                              <p className="text-gray-400 text-xs">Avg</p>
                              <p className="text-lg font-bold text-therapy-purple">
                                {stats.ageBreakdown.avg}
                              </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl text-center">
                              <p className="text-gray-400 text-xs">Max</p>
                              <p className="text-lg font-bold text-gray-700">
                                {stats.ageBreakdown.max}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm">No age data available</p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-therapy-pink" />
                    Ask About All Conversations
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Chat with AI to get insights from all analyzed conversations
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 h-[500px] pr-4 mb-4">
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                          <p className="text-gray-500 mb-6 text-lg">
                            What would you like to know?
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                            {[
                              'What are the most common issues users face?',
                              'What patterns do you see in the conversations?',
                              'What demographics use the chatbot most?',
                              'What improvements would you recommend?',
                              'Are there any concerning trends?',
                              'Summarize the types of help people seek',
                            ].map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                className="border-gray-200 text-gray-600 text-xs h-auto py-3 px-4 whitespace-normal text-left justify-start hover:bg-purple-50 hover:border-therapy-purple hover:text-therapy-purple"
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
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
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
                                <Wand2 className="h-4 w-4 text-white" />
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
                            <Wand2 className="h-4 w-4 text-white animate-pulse" />
                          </div>
                          <div className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-therapy-purple/5 to-therapy-pink/5 border border-purple-100">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-therapy-purple animate-bounce" />
                              <div
                                className="w-2 h-2 rounded-full bg-therapy-purple animate-bounce"
                                style={{ animationDelay: '0.1s' }}
                              />
                              <div
                                className="w-2 h-2 rounded-full bg-therapy-purple animate-bounce"
                                style={{ animationDelay: '0.2s' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask about patterns, demographics, trends, or specific insights..."
                      className="bg-white border-gray-200 resize-none"
                      rows={2}
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
                      className="bg-gradient-to-r from-therapy-purple to-therapy-pink hover:opacity-90 text-white h-auto"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AggregateAnalysis;
