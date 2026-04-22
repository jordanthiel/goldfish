import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  internalCmsService,
  FunnelAnalyticsData,
} from '@/services/internalCmsService';
import { FUNNEL_STEPS, FunnelEventName } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Cell,
} from 'recharts';
import {
  ArrowLeft,
  Filter,
  TrendingDown,
  Users,
  Mail,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STEP_LABELS: Record<FunnelEventName, string> = {
  page_view: 'Page View',
  chat_started: 'Chat Started',
  message_sent: 'Sent Message',
  conversation_complete: 'Chat Complete',
  email_capture_shown: 'Form Shown',
  email_capture_submitted: 'Submitted',
};

const FUNNEL_COLORS = [
  'hsl(262, 80%, 55%)',
  'hsl(262, 70%, 60%)',
  'hsl(280, 65%, 60%)',
  'hsl(320, 65%, 60%)',
  'hsl(340, 70%, 62%)',
  'hsl(350, 75%, 58%)',
];

const funnelChartConfig: ChartConfig = {
  sessions: { label: 'Unique Sessions', color: 'hsl(262, 80%, 55%)' },
};

const trendChartConfig: ChartConfig = {
  page_view: { label: 'Page View', color: 'hsl(262, 80%, 55%)' },
  chat_started: { label: 'Chat Started', color: 'hsl(280, 65%, 60%)' },
  email_capture_submitted: { label: 'Submitted', color: 'hsl(350, 75%, 58%)' },
};

const variantChartConfig: ChartConfig = {
  A: { label: 'Variant A (Trust)', color: 'hsl(262, 80%, 55%)' },
  B: { label: 'Variant B (Scarcity)', color: 'hsl(340, 70%, 62%)' },
};

const FunnelAnalytics: React.FC = () => {
  const { isInternal, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<FunnelAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

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
    if (isInternal) loadData();
  }, [isInternal, days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await internalCmsService.getFunnelAnalytics(days);
      setData(result);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load funnel analytics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple" />
      </div>
    );
  }

  if (!isInternal) return null;

  // ---------- derived data ----------

  const funnelBars = (data?.funnelCounts ?? []).map((fc, i) => ({
    name: STEP_LABELS[fc.event_name as FunnelEventName] ?? fc.event_name,
    sessions: fc.count,
    fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }));

  // Drop-off percentages between consecutive funnel steps
  const dropoffs = FUNNEL_STEPS.map((step, i) => {
    const curr = data?.funnelCounts.find((f) => f.event_name === step)?.count ?? 0;
    const prev =
      i === 0
        ? curr
        : data?.funnelCounts.find((f) => f.event_name === FUNNEL_STEPS[i - 1])?.count ?? 0;
    const rate = prev > 0 ? ((prev - curr) / prev) * 100 : 0;
    return {
      step: STEP_LABELS[step],
      event: step,
      count: curr,
      dropoff: i === 0 ? 0 : rate,
      conversion: prev > 0 ? (curr / prev) * 100 : 0,
    };
  });

  // Variant comparison (only steps where variant is meaningful)
  const variantSteps: FunnelEventName[] = [
    'email_capture_shown',
    'email_capture_submitted',
  ];
  const variantComparison = variantSteps.map((step) => {
    const aCount =
      data?.variantBreakdown.find((v) => v.event_name === step && v.ab_variant === 'A')?.count ?? 0;
    const bCount =
      data?.variantBreakdown.find((v) => v.event_name === step && v.ab_variant === 'B')?.count ?? 0;
    return { name: STEP_LABELS[step], A: aCount, B: bCount };
  });

  // Compute A/B conversion rate from shown → submitted
  const aShown =
    data?.variantBreakdown.find((v) => v.event_name === 'email_capture_shown' && v.ab_variant === 'A')?.count ?? 0;
  const aSubmitted =
    data?.variantBreakdown.find((v) => v.event_name === 'email_capture_submitted' && v.ab_variant === 'A')?.count ?? 0;
  const bShown =
    data?.variantBreakdown.find((v) => v.event_name === 'email_capture_shown' && v.ab_variant === 'B')?.count ?? 0;
  const bSubmitted =
    data?.variantBreakdown.find((v) => v.event_name === 'email_capture_submitted' && v.ab_variant === 'B')?.count ?? 0;
  const aRate = aShown > 0 ? ((aSubmitted / aShown) * 100).toFixed(1) : '—';
  const bRate = bShown > 0 ? ((bSubmitted / bShown) * 100).toFixed(1) : '—';

  // Daily trend — pivot to one row per date with key event counts
  const trendKeys: FunnelEventName[] = ['page_view', 'chat_started', 'email_capture_submitted'];
  const dateSet = new Set((data?.dailyTrend ?? []).map((d) => d.date));
  const trendRows = Array.from(dateSet)
    .sort()
    .map((date) => {
      const row: Record<string, unknown> = { date };
      for (const key of trendKeys) {
        row[key] = data?.dailyTrend.find((d) => d.date === date && d.event_name === key)?.count ?? 0;
      }
      return row;
    });

  // Overall conversion: page_view → submitted
  const totalPageViews = data?.funnelCounts.find((f) => f.event_name === 'page_view')?.count ?? 0;
  const totalSubmitted =
    data?.funnelCounts.find((f) => f.event_name === 'email_capture_submitted')?.count ?? 0;
  const overallConversion =
    totalPageViews > 0 ? ((totalSubmitted / totalPageViews) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />

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
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Funnel Analytics</h1>
                  <p className="text-xs text-gray-500">Drop-off analysis &amp; A/B test results</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger className="w-[140px] bg-white">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadData} className="border-gray-200">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Events',
                value: data?.totalEvents ?? 0,
                icon: Activity,
                color: 'text-therapy-purple',
              },
              {
                label: 'Unique Visitors',
                value: totalPageViews,
                icon: Users,
                color: 'text-blue-600',
              },
              {
                label: 'Waitlist Signups',
                value: data?.waitlistSubmissions ?? 0,
                icon: Mail,
                color: 'text-green-600',
              },
              {
                label: 'Overall Conversion',
                value: `${overallConversion}%`,
                icon: TrendingDown,
                color: 'text-therapy-pink',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-500 flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    {label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel bar chart */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-gray-800 text-base">Funnel Overview</CardTitle>
                <CardDescription>Unique sessions at each step</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <ChartContainer config={funnelChartConfig} className="h-[300px] w-full">
                    <BarChart data={funnelBars} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sessions" radius={[0, 6, 6, 0]}>
                        {funnelBars.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Drop-off table */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-gray-800 text-base">Step-by-Step Drop-off</CardTitle>
                <CardDescription>Where users leave the funnel</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <div className="space-y-3">
                    {dropoffs.map((d, i) => (
                      <div key={d.event} className="flex items-center gap-3">
                        <div
                          className="w-2 h-10 rounded-full"
                          style={{ backgroundColor: FUNNEL_COLORS[i] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {d.step}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{d.count}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${
                                    totalPageViews > 0 ? (d.count / totalPageViews) * 100 : 0
                                  }%`,
                                  backgroundColor: FUNNEL_COLORS[i],
                                }}
                              />
                            </div>
                            {i > 0 && (
                              <span
                                className={`text-xs font-medium ${
                                  d.dropoff > 50
                                    ? 'text-red-500'
                                    : d.dropoff > 25
                                      ? 'text-amber-500'
                                      : 'text-green-500'
                                }`}
                              >
                                {d.dropoff > 0 ? `-${d.dropoff.toFixed(0)}%` : '—'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A/B variant comparison */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-gray-800 text-base">A/B Test Comparison</CardTitle>
                <CardDescription>
                  Variant A (Trust) vs Variant B (Scarcity)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[260px]" />
                ) : (
                  <>
                    <ChartContainer config={variantChartConfig} className="h-[200px] w-full">
                      <BarChart data={variantComparison}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="A" fill="hsl(262, 80%, 55%)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="B" fill="hsl(340, 70%, 62%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                        <p className="text-xs text-gray-500">Variant A Conversion</p>
                        <p className="text-2xl font-bold text-therapy-purple">{aRate}%</p>
                        <p className="text-xs text-gray-400">
                          {aSubmitted} / {aShown} shown
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-pink-50 border border-pink-100 text-center">
                        <p className="text-xs text-gray-500">Variant B Conversion</p>
                        <p className="text-2xl font-bold text-therapy-pink">{bRate}%</p>
                        <p className="text-xs text-gray-400">
                          {bSubmitted} / {bShown} shown
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Daily trend */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-gray-800 text-base">Daily Trend</CardTitle>
                <CardDescription>Key events over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px]" />
                ) : trendRows.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                    No data for the selected period
                  </div>
                ) : (
                  <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                    <LineChart data={trendRows}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="page_view"
                        stroke="hsl(262, 80%, 55%)"
                        strokeWidth={2}
                        dot={false}
                        name="Page Views"
                      />
                      <Line
                        type="monotone"
                        dataKey="chat_started"
                        stroke="hsl(280, 65%, 60%)"
                        strokeWidth={2}
                        dot={false}
                        name="Chats Started"
                      />
                      <Line
                        type="monotone"
                        dataKey="email_capture_submitted"
                        stroke="hsl(350, 75%, 58%)"
                        strokeWidth={2}
                        dot={false}
                        name="Submissions"
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FunnelAnalytics;
