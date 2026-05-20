import React from 'react';
import {
  type AnalyticsFilterOptions,
  type AnalyticsFilters,
} from '@/services/analyticsExplorerService';
import { FUNNEL_STEPS, type FunnelEventName } from '@/services/analyticsService';
import { Button } from '@goldfish/shared/components/ui/button';
import { Input } from '@goldfish/shared/components/ui/input';
import { Label } from '@goldfish/shared/components/ui/label';
import { Badge } from '@goldfish/shared/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@goldfish/shared/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@goldfish/shared/components/ui/select';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import { cn } from '@goldfish/shared/lib/utils';

const STEP_LABELS: Record<FunnelEventName, string> = {
  page_view: 'Page view',
  chat_started: 'Chat started',
  message_sent: 'Message sent',
  conversation_complete: 'Chat complete',
  email_capture_shown: 'Form shown',
  email_capture_submitted: 'Submitted',
};

const DATE_PRESETS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

type Props = {
  filters: AnalyticsFilters;
  options: AnalyticsFilterOptions | null;
  onChange: (filters: AnalyticsFilters) => void;
  onApply: () => void;
  onReset: () => void;
  applying?: boolean;
};

export const AnalyticsFiltersBar: React.FC<Props> = ({
  filters,
  options,
  onChange,
  onApply,
  onReset,
  applying,
}) => {
  const set = (patch: Partial<AnalyticsFilters>) =>
    onChange({ ...filters, ...patch });

  const toggleEvent = (name: FunnelEventName) => {
    const next = filters.eventNames.includes(name)
      ? filters.eventNames.filter((e) => e !== name)
      : [...filters.eventNames, name];
    set({ eventNames: next });
  };

  const togglePage = (slug: string) => {
    const next = filters.pageSlugs.includes(slug)
      ? filters.pageSlugs.filter((p) => p !== slug)
      : [...filters.pageSlugs, slug];
    set({ pageSlugs: next });
  };

  const toggleVariant = (v: string) => {
    const next = filters.abVariants.includes(v)
      ? filters.abVariants.filter((x) => x !== v)
      : [...filters.abVariants, v];
    set({ abVariants: next });
  };

  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    set({
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    });
  };

  const activeFilterCount =
    filters.eventNames.length +
    filters.pageSlugs.length +
    filters.abVariants.length +
    (filters.trackingId ? 1 : 0) +
    (filters.sessionIdContains ? 1 : 0) +
    (filters.conversationId ? 1 : 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg p-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">From</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set({ dateFrom: e.target.value })}
            className="w-[150px] h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">To</Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set({ dateTo: e.target.value })}
            className="w-[150px] h-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pb-0.5">
          {DATE_PRESETS.map((p) => (
            <Button
              key={p.days}
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 bg-therapy-purple hover:bg-therapy-purple/90"
            onClick={onApply}
            disabled={applying}
          >
            <Search className="h-4 w-4 mr-1" />
            Apply filters
          </Button>
        </div>
      </div>

      <Collapsible defaultOpen={activeFilterCount > 0}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-gray-600">
            <ChevronDown className="h-4 w-4 mr-1" />
            Advanced filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">Event type</Label>
            <div className="flex flex-wrap gap-1.5">
              {FUNNEL_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => toggleEvent(step)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    filters.eventNames.length === 0 || filters.eventNames.includes(step)
                      ? filters.eventNames.length === 0 || filters.eventNames.includes(step)
                        ? filters.eventNames.length === 0
                          ? 'bg-therapy-purple/15 text-therapy-purple border-therapy-purple/30'
                          : 'bg-therapy-purple text-white border-therapy-purple'
                        : 'bg-white text-gray-600 border-gray-200'
                      : 'bg-gray-50 text-gray-400 border-gray-100 line-through',
                  )}
                >
                  {STEP_LABELS[step]}
                </button>
              ))}
              {filters.eventNames.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-gray-500 underline"
                  onClick={() => set({ eventNames: [] })}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {options && options.pageSlugs.length > 0 && (
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Landing page</Label>
              <div className="flex flex-wrap gap-1.5">
                {options.pageSlugs.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => togglePage(slug)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border font-mono',
                      filters.pageSlugs.includes(slug)
                        ? 'bg-therapy-purple text-white border-therapy-purple'
                        : 'bg-white text-gray-600 border-gray-200',
                    )}
                  >
                    {slug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-gray-500 mb-2 block">A/B variant</Label>
            <div className="flex gap-1.5">
              {['A', 'B', 'none'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVariant(v)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border font-mono',
                    filters.abVariants.includes(v)
                      ? 'bg-therapy-purple text-white border-therapy-purple'
                      : 'bg-white text-gray-600 border-gray-200',
                  )}
                >
                  {v === 'none' ? 'No variant' : `Variant ${v}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Share link ID</Label>
              {options && options.trackingIds.length > 0 ? (
                <Select
                  value={filters.trackingId || '__all__'}
                  onValueChange={(v) =>
                    set({ trackingId: v === '__all__' ? '' : v })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All links" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All links</SelectItem>
                    {options.trackingIds.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Exact tracking id"
                  value={filters.trackingId}
                  onChange={(e) => set({ trackingId: e.target.value })}
                  className="h-9 font-mono text-sm"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Session ID contains</Label>
              <Input
                placeholder="Partial session id"
                value={filters.sessionIdContains}
                onChange={(e) => set({ sessionIdContains: e.target.value })}
                className="h-9 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">Conversation ID</Label>
              <Input
                placeholder="UUID"
                value={filters.conversationId}
                onChange={(e) => set({ conversationId: e.target.value })}
                className="h-9 font-mono text-sm"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
