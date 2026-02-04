import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { internalCmsService, ConversationWithExtraction, AggregateStats } from '@/services/internalCmsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare,
  Users,
  Brain,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  LogOut,
  Eye,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const InternalDashboard: React.FC = () => {
  const { user, isInternal, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ConversationWithExtraction[]>([]);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

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
      loadData();
    }
  }, [isInternal, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conversationsResult, statsResult] = await Promise.all([
        internalCmsService.getConversations({
          limit: pageSize,
          offset: page * pageSize,
        }),
        internalCmsService.getAggregateStats(),
      ]);

      setConversations(conversationsResult.data);
      setTotalCount(conversationsResult.count);
      setStats(statsResult);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async (conversationId: string, forceReExtract: boolean = false) => {
    setExtractingId(conversationId);
    try {
      const result = await internalCmsService.extractConversation(conversationId, forceReExtract);
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
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to extract conversation.',
        variant: 'destructive',
      });
    } finally {
      setExtractingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageCount = (conv: ConversationWithExtraction) => {
    return conv.conversation_data?.length || 0;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

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
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Goldfish</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-therapy-purple" />
                <span className="text-sm font-medium text-gray-600">Internal CMS</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/internal/aggregate">
                <Button className="bg-gradient-to-r from-therapy-purple to-therapy-pink hover:opacity-90 text-white">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Aggregate Analysis
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-therapy-purple text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Internal User</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-therapy-purple" />
                  Total Conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-therapy-purple">{stats?.totalConversations || 0}</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-therapy-pink" />
                  Analyzed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-therapy-pink">{stats?.extractedConversations || 0}</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Last 7 Days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-green-600">{stats?.recentConversations || 0}</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  Avg Age
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-amber-600">
                    {stats?.ageBreakdown?.avg || 'N/A'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversations Table */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-800">Conversations</CardTitle>
                  <CardDescription className="text-gray-500">
                    View and analyze chatbot conversations
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-10 w-64 bg-white border-gray-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    className="border-gray-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-gray-100">
                        <TableHead className="text-gray-500">Session</TableHead>
                        <TableHead className="text-gray-500">Date</TableHead>
                        <TableHead className="text-gray-500">Model</TableHead>
                        <TableHead className="text-gray-500">Messages</TableHead>
                        <TableHead className="text-gray-500">Analyzed</TableHead>
                        <TableHead className="text-gray-500">User Info</TableHead>
                        <TableHead className="text-gray-500 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversations.map((conv) => (
                        <TableRow key={conv.id} className="hover:bg-purple-50/50 border-gray-100">
                          <TableCell className="font-mono text-xs text-gray-500">
                            {conv.session_id.slice(0, 16)}...
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {formatDate(conv.started_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-gray-200 text-gray-600 bg-white">
                              {conv.model_id.slice(0, 15)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700">{getMessageCount(conv)}</TableCell>
                          <TableCell>
                            {conv.extraction ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-200 text-gray-400">
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {conv.profile ? (
                              <div className="text-sm">
                                <span className="text-therapy-purple font-medium">
                                  {conv.profile.full_name || conv.profile.email || 'Logged In'}
                                </span>
                              </div>
                            ) : conv.extraction ? (
                              <div className="text-sm">
                                <span className="text-gray-700">
                                  {conv.extraction.extracted_name || 'Anonymous'}
                                </span>
                                {conv.extraction.extracted_age && (
                                  <span className="text-gray-400 ml-1">
                                    ({conv.extraction.extracted_age}y)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Anonymous</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={`/internal/conversation/${conv.id}`}>
                                <Button size="sm" variant="ghost" className="text-therapy-purple hover:text-therapy-purple hover:bg-purple-50">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-therapy-pink hover:text-therapy-pink hover:bg-pink-50"
                                onClick={() => handleExtract(conv.id, !!conv.extraction)}
                                disabled={extractingId === conv.id}
                              >
                                {extractingId === conv.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of{' '}
                      {totalCount} conversations
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 0}
                        className="border-gray-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600 px-2">
                        Page {page + 1} of {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="border-gray-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default InternalDashboard;
