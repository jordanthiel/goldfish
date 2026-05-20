import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@goldfish/shared/context/AuthContext';
import {
  internalCmsService,
  ConversationWithExtraction,
  AggregateStats,
  FunnelAnalyticsData,
  WaitlistSubmissionWithConversation,
} from '@/services/internalCmsService';
import { Button } from '@goldfish/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@goldfish/shared/components/ui/card';
import { Badge } from '@goldfish/shared/components/ui/badge';
import { Input } from '@goldfish/shared/components/ui/input';
import { Skeleton } from '@goldfish/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@goldfish/shared/components/ui/table';
import {
  MessageSquare,
  Users,
  Brain,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Wand2,
  RefreshCw,
  Eye,
  Mail,
} from 'lucide-react';
import { useToast } from '@goldfish/shared/hooks/use-toast';
import { VariantBadge } from '@/components/internal/VariantBadge';

const InternalDashboard: React.FC = () => {
  const { isInternal } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<ConversationWithExtraction[]>([]);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [waitlistSubmissions, setWaitlistSubmissions] = useState<WaitlistSubmissionWithConversation[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [waitlistPage, setWaitlistPage] = useState(0);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const pageSize = 15;
  const waitlistPageSize = 10;

  useEffect(() => {
    if (isInternal) {
      loadData();
    }
  }, [isInternal, page]);

  useEffect(() => {
    if (isInternal) {
      loadWaitlistData();
    }
  }, [isInternal, waitlistPage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [conversationsResult, statsResult, funnelResult] = await Promise.all([
        internalCmsService.getConversations({
          limit: pageSize,
          offset: page * pageSize,
        }),
        internalCmsService.getAggregateStats(),
        internalCmsService.getFunnelAnalytics(30),
      ]);

      setConversations(conversationsResult.data);
      setTotalCount(conversationsResult.count);
      setStats(statsResult);
      setFunnelData(funnelResult);
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

  const loadWaitlistData = async () => {
    setWaitlistLoading(true);
    try {
      const result = await internalCmsService.getWaitlistSubmissions({
        limit: waitlistPageSize,
        offset: waitlistPage * waitlistPageSize,
      });

      setWaitlistSubmissions(result.data);
      setWaitlistCount(result.count);
    } catch (error) {
      console.error('Error loading waitlist submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load waitlist signups.',
        variant: 'destructive',
      });
    } finally {
      setWaitlistLoading(false);
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

  const formatShortId = (value?: string | null, maxLength: number = 18) => {
    if (!value) return '—';
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const totalWaitlistPages = Math.ceil(waitlistCount / waitlistPageSize);


  if (!isInternal) {
    return null;
  }

  return (
    <>
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

          {/* Funnel KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link to="/waitlist" className="block">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:border-therapy-purple/30 border border-transparent transition-colors h-full">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-500 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-therapy-purple" />
                    Waitlist Signups (30d)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-3xl font-bold text-therapy-purple">{funnelData?.waitlistSubmissions ?? 0}</p>
                  )}
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader className="pb-2">
                <CardDescription className="text-gray-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-therapy-pink" />
                  Funnel Conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-therapy-pink">
                    {(() => {
                      const views = funnelData?.funnelCounts.find(f => f.event_name === 'page_view')?.count ?? 0;
                      const subs = funnelData?.funnelCounts.find(f => f.event_name === 'email_capture_submitted')?.count ?? 0;
                      return views > 0 ? `${((subs / views) * 100).toFixed(1)}%` : '—';
                    })()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Link to="/funnel" className="block">
              <Card className="bg-gradient-to-br from-therapy-purple/5 to-therapy-pink/5 backdrop-blur-sm shadow-lg border border-purple-100 hover:border-therapy-purple/40 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-500">Funnel Events (30d)</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-gray-700">{funnelData?.totalEvents ?? 0}</p>
                      <span className="text-sm text-therapy-purple font-medium">View details &rarr;</span>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Waitlist submissions */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-therapy-purple" />
                    Waitlist Signups
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Users who submitted the waitlist form, mapped back to their chat conversation when available
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-purple-100 text-therapy-purple bg-purple-50">
                    {waitlistCount} total
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadWaitlistData}
                    className="border-gray-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {waitlistLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : waitlistSubmissions.length === 0 ? (
                <div className="py-10 text-center">
                  <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No waitlist signups found yet.</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-gray-100">
                        <TableHead className="text-gray-500">Submitted</TableHead>
                        <TableHead className="text-gray-500">User</TableHead>
                        <TableHead className="text-gray-500">Source</TableHead>
                        <TableHead className="text-gray-500">Conversation Mapping</TableHead>
                        <TableHead className="text-gray-500 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitlistSubmissions.map((submission) => (
                        <TableRow key={submission.id} className="hover:bg-purple-50/50 border-gray-100">
                          <TableCell className="text-gray-700">
                            {formatDate(submission.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-gray-800">{submission.name}</p>
                              <a
                                href={`mailto:${submission.email}`}
                                className="text-sm text-therapy-purple hover:underline"
                              >
                                {submission.email}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-white">
                                Variant {submission.ab_variant}
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {submission.page_slug ? `/${submission.page_slug}` : 'Default chat'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {submission.conversation ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    {submission.conversationMatch === 'conversation_id' ? 'Direct link' : 'Session match'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {submission.conversation.message_count} messages
                                  </span>
                                </div>
                                <p className="font-mono text-xs text-gray-500">
                                  {formatShortId(submission.conversation.id, 22)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Started {formatDate(submission.conversation.started_at)}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                                  No conversation found
                                </Badge>
                                <p className="font-mono text-xs text-gray-400">
                                  Session {formatShortId(submission.session_id, 22)}
                                </p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {submission.conversation ? (
                              <Link to={`/conversation/${submission.conversation.id}`}>
                                <Button size="sm" variant="ghost" className="text-therapy-purple hover:text-therapy-purple hover:bg-purple-50">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View chat
                                </Button>
                              </Link>
                            ) : (
                              <Button size="sm" variant="ghost" disabled>
                                <Eye className="h-4 w-4 mr-2" />
                                View chat
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Showing {waitlistPage * waitlistPageSize + 1} to{' '}
                      {Math.min((waitlistPage + 1) * waitlistPageSize, waitlistCount)} of{' '}
                      {waitlistCount} waitlist signups
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWaitlistPage(waitlistPage - 1)}
                        disabled={waitlistPage === 0}
                        className="border-gray-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600 px-2">
                        Page {waitlistPage + 1} of {totalWaitlistPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWaitlistPage(waitlistPage + 1)}
                        disabled={waitlistPage >= totalWaitlistPages - 1}
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
                        <TableHead className="text-gray-500">A/B variant</TableHead>
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
                          <TableCell>
                            <VariantBadge variant={conv.emailCaptureVariant} />
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
                              <Link to={`/conversation/${conv.id}`}>
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
                                  <Wand2 className="h-4 w-4" />
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
    </>
  );
};

export default InternalDashboard;
