import React, { useCallback, useEffect, useState } from 'react';
import {
  analyticsExplorerService,
  type AnalyticsFilters,
  type BreakdownRow,
} from '@/services/analyticsExplorerService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsTruncationBanner } from './AnalyticsTruncationBanner';

type BreakdownSet = {
  byPage: BreakdownRow[];
  byTrackingId: BreakdownRow[];
  byVariant: BreakdownRow[];
  byEvent: BreakdownRow[];
  truncated: boolean;
};

type Props = {
  filters: AnalyticsFilters;
  refreshKey: number;
};

const BreakdownTable: React.FC<{
  title: string;
  description: string;
  rows: BreakdownRow[];
  loading: boolean;
}> = ({ title, description, rows, loading }) => (
  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-40" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No data</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-mono text-sm max-w-[180px] truncate" title={row.label}>
                  {row.label}
                </TableCell>
                <TableCell className="text-right">{row.sessions}</TableCell>
                <TableCell className="text-right">{row.events}</TableCell>
                <TableCell className="text-right">{row.submissions}</TableCell>
                <TableCell className="text-right text-sm">
                  {row.conversionRate > 0 ? `${row.conversionRate.toFixed(1)}%` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export const AnalyticsBreakdownTab: React.FC<Props> = ({ filters, refreshKey }) => {
  const { toast } = useToast();
  const [data, setData] = useState<BreakdownSet | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyticsExplorerService.getBreakdowns(filters);
      setData(result);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load breakdowns.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <>
      <AnalyticsTruncationBanner truncated={data?.truncated} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownTable
          title="By landing page"
          description="Sessions and conversions per page slug"
          rows={data?.byPage ?? []}
          loading={loading}
        />
        <BreakdownTable
          title="By share link"
          description="Traffic attributed to ?id= tracking"
          rows={data?.byTrackingId ?? []}
          loading={loading}
        />
        <BreakdownTable
          title="By A/B variant"
          description="Email capture test segments"
          rows={data?.byVariant ?? []}
          loading={loading}
        />
        <BreakdownTable
          title="By event type"
          description="Raw event volume per step"
          rows={data?.byEvent ?? []}
          loading={loading}
        />
      </div>
    </>
  );
};
