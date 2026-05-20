import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  analyticsExplorerService,
  type AnalyticsFilters,
  type SessionAnalyticsRow,
  type SessionSortField,
  type SortDirection,
} from '@/services/analyticsExplorerService';
import { FUNNEL_STEPS, type FunnelEventName } from '@/services/analyticsService';
import { Button } from '@goldfish/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@goldfish/shared/components/ui/card';
import { Badge } from '@goldfish/shared/components/ui/badge';
import { Skeleton } from '@goldfish/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@goldfish/shared/components/ui/table';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useToast } from '@goldfish/shared/hooks/use-toast';
import { SortableTableHead } from './SortableTableHead';
import { AnalyticsTruncationBanner } from './AnalyticsTruncationBanner';
import { VariantBadge } from '@/components/internal/VariantBadge';

const STEP_LABELS: Record<FunnelEventName, string> = {
  page_view: 'Page view',
  chat_started: 'Chat started',
  message_sent: 'Messages',
  conversation_complete: 'Complete',
  email_capture_shown: 'Form shown',
  email_capture_submitted: 'Submitted',
};

const PAGE_SIZE = 25;

type Props = {
  filters: AnalyticsFilters;
  refreshKey: number;
};

export const AnalyticsSessionsTab: React.FC<Props> = ({ filters, refreshKey }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<SessionAnalyticsRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const [sortField, setSortField] = useState<SessionSortField>('last_seen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyticsExplorerService.querySessions(filters, {
        page,
        pageSize: PAGE_SIZE,
        sortField,
        sortDirection,
      });
      setRows(result.data);
      setCount(result.count);
      setTruncated(result.truncated);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load sessions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, sortField, sortDirection, toast]);

  useEffect(() => {
    setPage(0);
  }, [refreshKey, filters]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleSort = (field: string) => {
    const f = field as SessionSortField;
    if (sortField === f) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(f);
      setSortDirection('desc');
    }
    setPage(0);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>
          One row per visitor session with funnel progress. {count.toLocaleString()} sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnalyticsTruncationBanner truncated={truncated} />
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No sessions match these filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      label="Last active"
                      field="last_seen"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="First seen"
                      field="first_seen"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Session</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Link ID</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Journey</TableHead>
                    <SortableTableHead
                      label="Events"
                      field="event_count"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="Depth"
                      field="max_step"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.sessionId}>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(row.lastSeenAt)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(row.firstSeenAt)}
                      </TableCell>
                      <TableCell
                        className="text-xs font-mono text-gray-500 max-w-[100px] truncate"
                        title={row.sessionId}
                      >
                        …{row.sessionId.slice(-12)}
                      </TableCell>
                      <TableCell>
                        <VariantBadge variant={row.abVariant} showName={false} />
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {row.trackingId ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {row.pageSlugs.join(', ') || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5 max-w-[200px]">
                          {FUNNEL_STEPS.map((step) => (
                            <span
                              key={step}
                              title={STEP_LABELS[step]}
                              className={`text-[10px] px-1 rounded ${
                                row.completedSteps.includes(step)
                                  ? 'bg-therapy-purple/90 text-white'
                                  : 'bg-gray-100 text-gray-300'
                              }`}
                            >
                              {STEP_LABELS[step].charAt(0)}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.eventCount}
                        {row.messageCount > 0 && (
                          <span className="text-xs text-gray-400 block">
                            {row.messageCount} msgs
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.waitlistSubmitted ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            Waitlist
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {STEP_LABELS[FUNNEL_STEPS[row.maxStepIndex]] ?? '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.conversationId ? (
                          <Button size="sm" variant="ghost" asChild className="h-8">
                            <Link to={`/conversation/${row.conversationId}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
