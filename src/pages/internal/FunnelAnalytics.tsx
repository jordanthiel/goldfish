import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  analyticsExplorerService,
  DEFAULT_ANALYTICS_FILTERS,
  type AnalyticsFilterOptions,
  type AnalyticsFilters,
} from '@/services/analyticsExplorerService';
import type { FunnelAnalyticsData } from '@/services/internalCmsService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInternalPageHeader } from '@/components/internal/InternalLayoutContext';
import { AnalyticsFiltersBar } from '@/components/internal/analytics/AnalyticsFiltersBar';
import { AnalyticsOverviewTab } from '@/components/internal/analytics/AnalyticsOverviewTab';
import { AnalyticsEventsTab } from '@/components/internal/analytics/AnalyticsEventsTab';
import { AnalyticsSessionsTab } from '@/components/internal/analytics/AnalyticsSessionsTab';
import { AnalyticsBreakdownTab } from '@/components/internal/analytics/AnalyticsBreakdownTab';

type OverviewData = FunnelAnalyticsData & {
  uniqueSessions?: number;
  truncated?: boolean;
};

const FunnelAnalytics: React.FC = () => {
  const { isInternal } = useAuth();
  const { toast } = useToast();

  const [draftFilters, setDraftFilters] = useState<AnalyticsFilters>(DEFAULT_ANALYTICS_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>(DEFAULT_ANALYTICS_FILTERS);
  const [filterOptions, setFilterOptions] = useState<AnalyticsFilterOptions | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [applying, setApplying] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const loadFilterOptions = useCallback(async (range: AnalyticsFilters) => {
    try {
      const options = await analyticsExplorerService.getFilterOptions({
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
      });
      setFilterOptions(options);
    } catch {
      setFilterOptions(null);
    }
  }, []);

  const loadOverview = useCallback(async (filters: AnalyticsFilters) => {
    setLoadingOverview(true);
    try {
      const result = await analyticsExplorerService.getOverview(filters);
      setOverview(result);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load analytics overview.',
        variant: 'destructive',
      });
    } finally {
      setLoadingOverview(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isInternal) return;
    loadFilterOptions(appliedFilters);
    loadOverview(appliedFilters);
  }, [isInternal, appliedFilters, refreshKey, loadFilterOptions, loadOverview]);

  const handleApply = async () => {
    setApplying(true);
    setAppliedFilters(draftFilters);
    setRefreshKey((k) => k + 1);
    await loadFilterOptions(draftFilters);
    setApplying(false);
  };

  const handleReset = () => {
    const defaults = DEFAULT_ANALYTICS_FILTERS();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setRefreshKey((k) => k + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  useInternalPageHeader(
    {
      headerActions: (
        <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9">
          <RefreshCw className={`h-4 w-4 ${loadingOverview ? 'animate-spin' : ''}`} />
        </Button>
      ),
    },
    [loadingOverview],
  );

  if (!isInternal) return null;

  return (
    <div className="space-y-6">
      <AnalyticsFiltersBar
        filters={draftFilters}
        options={filterOptions}
        onChange={setDraftFilters}
        onApply={handleApply}
        onReset={handleReset}
        applying={applying}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/80 border border-gray-200 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="events">Event log</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdowns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AnalyticsOverviewTab data={overview} loading={loadingOverview} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <AnalyticsSessionsTab filters={appliedFilters} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <AnalyticsEventsTab filters={appliedFilters} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="breakdown" className="mt-6">
          <AnalyticsBreakdownTab filters={appliedFilters} refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FunnelAnalytics;
