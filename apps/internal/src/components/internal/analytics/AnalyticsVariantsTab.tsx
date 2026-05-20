import React, { useCallback, useEffect, useState } from 'react';
import {
  analyticsExplorerService,
  type AnalyticsFilters,
  type VariantComparisonData,
} from '@/services/analyticsExplorerService';
import { VariantBadge } from '@/components/internal/VariantBadge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@goldfish/shared/components/ui/card';
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@goldfish/shared/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useToast } from '@goldfish/shared/hooks/use-toast';
import { AnalyticsTruncationBanner } from './AnalyticsTruncationBanner';
import { EMAIL_CAPTURE_VARIANT_LABELS } from '@/utils/emailCaptureVariantLabels';

const chartConfig: ChartConfig = {
  A: { label: 'Variant A (Trust)', color: 'hsl(262, 80%, 55%)' },
  B: { label: 'Variant B (Scarcity)', color: 'hsl(340, 70%, 62%)' },
};

type Props = {
  filters: AnalyticsFilters;
  refreshKey: number;
};

const pct = (value: number | null) =>
  value == null ? '—' : `${value.toFixed(1)}%`;

export const AnalyticsVariantsTab: React.FC<Props> = ({ filters, refreshKey }) => {
  const { toast } = useToast();
  const [data, setData] = useState<VariantComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyticsExplorerService.getVariantComparison(filters);
      setData(result);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load variant comparison.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const chartRows =
    data?.funnelByStep.map((row) => ({
      name: row.stepLabel,
      A: row.sessionsA,
      B: row.sessionsB,
    })) ?? [];

  return (
    <>
      <AnalyticsTruncationBanner truncated={data?.truncated} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <VariantBadge variant="A" />
              <span>{EMAIL_CAPTURE_VARIANT_LABELS.A.description}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <p>
                  <span className="text-gray-500">Sessions with events:</span>{' '}
                  <strong>{data?.assignedSessionsA ?? 0}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Waitlist signups:</span>{' '}
                  <strong>{data?.waitlistSignupsA ?? 0}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Form → signup:</span>{' '}
                  <strong>{pct(data?.formToSignupRateA ?? null)}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Page view → signup:</span>{' '}
                  <strong>{pct(data?.pageToSignupRateA ?? null)}</strong>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <VariantBadge variant="B" />
              <span>{EMAIL_CAPTURE_VARIANT_LABELS.B.description}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {loading ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <p>
                  <span className="text-gray-500">Sessions with events:</span>{' '}
                  <strong>{data?.assignedSessionsB ?? 0}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Waitlist signups:</span>{' '}
                  <strong>{data?.waitlistSignupsB ?? 0}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Form → signup:</span>{' '}
                  <strong>{pct(data?.formToSignupRateB ?? null)}</strong>
                </p>
                <p>
                  <span className="text-gray-500">Page view → signup:</span>{' '}
                  <strong>{pct(data?.pageToSignupRateB ?? null)}</strong>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl mb-6">
        <CardHeader>
          <CardTitle className="text-base">Funnel by variant</CardTitle>
          <CardDescription>
            Unique sessions at each step, split by A/B assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px]" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={chartRows} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="A" fill="hsl(262, 80%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="B" fill="hsl(340, 70%, 62%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Step-by-step comparison</CardTitle>
          <CardDescription>
            Session counts and step conversion (% of previous step, same variant)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead className="text-right">
                      <VariantBadge variant="A" showName={false} />
                    </TableHead>
                    <TableHead className="text-right">A conv.</TableHead>
                    <TableHead className="text-right">
                      <VariantBadge variant="B" showName={false} />
                    </TableHead>
                    <TableHead className="text-right">B conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.funnelByStep.map((row) => (
                    <TableRow key={row.step}>
                      <TableCell className="font-medium text-gray-700">
                        {row.stepLabel}
                      </TableCell>
                      <TableCell className="text-right">{row.sessionsA}</TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {pct(row.stepConversionA)}
                      </TableCell>
                      <TableCell className="text-right">{row.sessionsB}</TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {pct(row.stepConversionB)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
