import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  analyticsExplorerService,
  type AnalyticsFilters,
  type EventSortField,
  type FunnelEventRow,
  type SortDirection,
} from '@/services/analyticsExplorerService';
import { FUNNEL_STEPS, type FunnelEventName } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SortableTableHead } from './SortableTableHead';
import { AnalyticsTruncationBanner } from './AnalyticsTruncationBanner';
import { VariantBadge } from '@/components/internal/VariantBadge';

const STEP_LABELS: Record<FunnelEventName, string> = {
  page_view: 'Page view',
  chat_started: 'Chat started',
  message_sent: 'Message sent',
  conversation_complete: 'Chat complete',
  email_capture_shown: 'Form shown',
  email_capture_submitted: 'Submitted',
};

const PAGE_SIZE = 50;

type Props = {
  filters: AnalyticsFilters;
  refreshKey: number;
};

export const AnalyticsEventsTab: React.FC<Props> = ({ filters, refreshKey }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<FunnelEventRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const [sortField, setSortField] = useState<EventSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyticsExplorerService.queryEvents(filters, {
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
        description: 'Failed to load events.',
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
    const f = field as EventSortField;
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
      second: '2-digit',
    });

  const trackingId = (row: FunnelEventRow) =>
    row.tracking_id ??
    (typeof row.metadata?.trackingId === 'string' ? row.metadata.trackingId : null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await analyticsExplorerService.exportEventsCsv(
        filters,
        sortField,
        sortDirection,
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `funnel-events-${filters.dateFrom}-${filters.dateTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'CSV download started.' });
    } catch {
      toast({
        title: 'Export failed',
        description: 'Could not export events.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Event log</CardTitle>
          <CardDescription>
            Every funnel event matching your filters. {count.toLocaleString()} total.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting || loading}
        >
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <AnalyticsTruncationBanner truncated={truncated} />
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No events match these filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      label="Time"
                      field="created_at"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="Event"
                      field="event_name"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="Page"
                      field="page_slug"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="Session"
                      field="session_id"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="Link ID"
                      field="tracking_id"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal text-xs">
                          {STEP_LABELS[row.event_name as FunnelEventName] ?? row.event_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-600">
                        {row.page_slug ?? '—'}
                      </TableCell>
                      <TableCell
                        className="text-xs font-mono text-gray-500 max-w-[120px] truncate"
                        title={row.session_id}
                      >
                        {row.session_id}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-500">
                        {trackingId(row) ?? '—'}
                      </TableCell>
                      <TableCell>
                        <VariantBadge variant={row.ab_variant as 'A' | 'B' | null} showName={false} />
                      </TableCell>
                      <TableCell className="text-right">
                        {row.conversation_id ? (
                          <Button size="sm" variant="ghost" asChild className="h-8">
                            <Link to={`/internal/conversation/${row.conversation_id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
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
