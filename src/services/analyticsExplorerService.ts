import { supabase } from '@/integrations/supabase/client';
import {
  FUNNEL_STEPS,
  type FunnelEventName,
} from '@/services/analyticsService';
import type {
  DailyEventCount,
  FunnelAnalyticsData,
  FunnelStepCount,
  FunnelVariantBreakdown,
} from '@/services/internalCmsService';

export const ANALYTICS_FETCH_LIMIT = 20_000;

export interface AnalyticsDateRange {
  dateFrom: string;
  dateTo: string;
}

export interface AnalyticsFilters extends AnalyticsDateRange {
  eventNames: FunnelEventName[];
  pageSlugs: string[];
  abVariants: string[];
  trackingId: string;
  sessionIdContains: string;
  conversationId: string;
}

export type EventSortField =
  | 'created_at'
  | 'event_name'
  | 'page_slug'
  | 'session_id'
  | 'tracking_id';

export type SessionSortField =
  | 'last_seen'
  | 'first_seen'
  | 'event_count'
  | 'max_step';

export type SortDirection = 'asc' | 'desc';

export interface FunnelEventRow {
  id: string;
  event_name: string;
  session_id: string;
  tracking_id: string | null;
  conversation_id: string | null;
  ab_variant: string | null;
  page_slug: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SessionAnalyticsRow {
  sessionId: string;
  trackingId: string | null;
  abVariant: string | null;
  pageSlugs: string[];
  conversationId: string | null;
  eventCount: number;
  messageCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  completedSteps: FunnelEventName[];
  maxStepIndex: number;
  waitlistSubmitted: boolean;
}

export interface BreakdownRow {
  key: string;
  label: string;
  sessions: number;
  events: number;
  submissions: number;
  conversionRate: number;
}

export interface AnalyticsFilterOptions {
  pageSlugs: string[];
  trackingIds: string[];
  eventNames: FunnelEventName[];
}

const VARIANT_STEP_LABELS: Record<FunnelEventName, string> = {
  page_view: 'Page view',
  chat_started: 'Chat started',
  message_sent: 'Sent message',
  conversation_complete: 'Chat complete',
  email_capture_shown: 'Email form shown',
  email_capture_submitted: 'Waitlist signup',
};

export interface VariantFunnelRow {
  step: FunnelEventName;
  stepLabel: string;
  sessionsA: number;
  sessionsB: number;
  stepConversionA: number | null;
  stepConversionB: number | null;
}

export interface VariantComparisonData {
  funnelByStep: VariantFunnelRow[];
  assignedSessionsA: number;
  assignedSessionsB: number;
  waitlistSignupsA: number;
  waitlistSignupsB: number;
  formToSignupRateA: number | null;
  formToSignupRateB: number | null;
  pageToSignupRateA: number | null;
  pageToSignupRateB: number | null;
  truncated: boolean;
}

export const DEFAULT_ANALYTICS_FILTERS = (): AnalyticsFilters => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
    eventNames: [],
    pageSlugs: [],
    abVariants: [],
    trackingId: '',
    sessionIdContains: '',
    conversationId: '',
  };
};

export function filtersToDateRange(filters: AnalyticsFilters): {
  fromISO: string;
  toISO: string;
} {
  const from = new Date(`${filters.dateFrom}T00:00:00`);
  const to = new Date(`${filters.dateTo}T23:59:59.999`);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

function resolveTrackingId(row: FunnelEventRow): string | null {
  if (row.tracking_id) return row.tracking_id;
  const meta = row.metadata?.trackingId;
  return typeof meta === 'string' ? meta : null;
}

type AbVariant = 'A' | 'B';

function isAbVariant(v: string | null | undefined): v is AbVariant {
  return v === 'A' || v === 'B';
}

/** First A/B variant recorded for each session (from any funnel event). */
function buildSessionVariantMap(rows: FunnelEventRow[]): Map<string, AbVariant> {
  const map = new Map<string, AbVariant>();
  for (const r of rows) {
    if (!isAbVariant(r.ab_variant) || map.has(r.session_id)) continue;
    map.set(r.session_id, r.ab_variant);
  }
  return map;
}

function effectiveAbVariant(
  row: FunnelEventRow,
  sessionVariants: Map<string, AbVariant>,
): string | null {
  if (isAbVariant(row.ab_variant)) return row.ab_variant;
  return sessionVariants.get(row.session_id) ?? null;
}

function applyClientFilters(
  rows: FunnelEventRow[],
  filters: AnalyticsFilters,
): FunnelEventRow[] {
  const sessionVariants = buildSessionVariantMap(rows);
  return rows.filter((r) => {
    if (filters.eventNames.length > 0 && !filters.eventNames.includes(r.event_name as FunnelEventName)) {
      return false;
    }
    if (filters.pageSlugs.length > 0) {
      if (!r.page_slug || !filters.pageSlugs.includes(r.page_slug)) return false;
    }
    if (filters.abVariants.length > 0) {
      const v = effectiveAbVariant(r, sessionVariants) ?? 'none';
      if (!filters.abVariants.includes(v)) return false;
    }
    if (filters.trackingId.trim()) {
      const tid = resolveTrackingId(r);
      if (tid !== filters.trackingId.trim()) return false;
    }
    if (filters.sessionIdContains.trim()) {
      if (!r.session_id.includes(filters.sessionIdContains.trim())) return false;
    }
    if (filters.conversationId.trim()) {
      if (r.conversation_id !== filters.conversationId.trim()) return false;
    }
    return true;
  });
}

async function fetchEventsInRange(
  fromISO: string,
  toISO: string,
): Promise<FunnelEventRow[]> {
  const { data, error } = await supabase
    .from('funnel_events')
    .select(
      'id, event_name, session_id, tracking_id, conversation_id, ab_variant, page_slug, metadata, created_at',
    )
    .gte('created_at', fromISO)
    .lte('created_at', toISO)
    .order('created_at', { ascending: true })
    .limit(ANALYTICS_FETCH_LIMIT);

  if (error) throw error;
  return (data ?? []) as FunnelEventRow[];
}

function buildAggregated(rows: FunnelEventRow[], filters: AnalyticsFilters): FunnelAnalyticsData & {
  truncated: boolean;
  rawRowCount: number;
} {
  const filtered = applyClientFilters(rows, filters);

  const sessionsByEvent = new Map<string, Set<string>>();
  for (const r of filtered) {
    if (!sessionsByEvent.has(r.event_name)) sessionsByEvent.set(r.event_name, new Set());
    sessionsByEvent.get(r.event_name)!.add(r.session_id);
  }

  const funnelCounts: FunnelStepCount[] = FUNNEL_STEPS.map((name) => ({
    event_name: name,
    count: sessionsByEvent.get(name)?.size ?? 0,
  }));

  const sessionVariants = buildSessionVariantMap(filtered);
  const variantKey = (e: string, v: string | null) => `${e}|${v ?? 'none'}`;
  const variantSessions = new Map<string, Set<string>>();
  for (const r of filtered) {
    const k = variantKey(r.event_name, effectiveAbVariant(r, sessionVariants));
    if (!variantSessions.has(k)) variantSessions.set(k, new Set());
    variantSessions.get(k)!.add(r.session_id);
  }
  const variantBreakdown: FunnelVariantBreakdown[] = [];
  for (const [k, sessions] of variantSessions) {
    const [event_name, ab_variant] = k.split('|');
    variantBreakdown.push({
      event_name,
      ab_variant: ab_variant === 'none' ? null : ab_variant,
      count: sessions.size,
    });
  }

  const dailyMap = new Map<string, number>();
  for (const r of filtered) {
    const day = r.created_at.slice(0, 10);
    const k = `${day}|${r.event_name}`;
    dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1);
  }
  const dailyTrend: DailyEventCount[] = [];
  for (const [k, count] of dailyMap) {
    const [date, event_name] = k.split('|');
    dailyTrend.push({ date, event_name, count });
  }
  dailyTrend.sort((a, b) => a.date.localeCompare(b.date));

  return {
    funnelCounts,
    variantBreakdown,
    dailyTrend,
    waitlistSubmissions: filtered.filter((r) => r.event_name === 'email_capture_submitted').length,
    totalEvents: filtered.length,
    truncated: rows.length >= ANALYTICS_FETCH_LIMIT,
    rawRowCount: rows.length,
  };
}

function buildSessionRows(rows: FunnelEventRow[]): SessionAnalyticsRow[] {
  const sessionVariants = buildSessionVariantMap(rows);
  const bySession = new Map<string, FunnelEventRow[]>();
  for (const r of rows) {
    const list = bySession.get(r.session_id) ?? [];
    list.push(r);
    bySession.set(r.session_id, list);
  }

  const sessions: SessionAnalyticsRow[] = [];
  for (const [sessionId, events] of bySession) {
    const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const completedSteps = FUNNEL_STEPS.filter((step) =>
      sorted.some((e) => e.event_name === step),
    );
    const maxStepIndex = Math.max(
      -1,
      ...completedSteps.map((s) => FUNNEL_STEPS.indexOf(s)),
    );
    const pageSlugs = [...new Set(sorted.map((e) => e.page_slug).filter(Boolean))] as string[];
    const conversationId =
      [...sorted].reverse().find((e) => e.conversation_id)?.conversation_id ?? null;
    const trackingId =
      [...sorted].reverse().map(resolveTrackingId).find(Boolean) ?? null;
    const abVariant = sessionVariants.get(sessionId) ?? null;

    sessions.push({
      sessionId,
      trackingId,
      abVariant,
      pageSlugs,
      conversationId,
      eventCount: sorted.length,
      messageCount: sorted.filter((e) => e.event_name === 'message_sent').length,
      firstSeenAt: sorted[0].created_at,
      lastSeenAt: sorted[sorted.length - 1].created_at,
      completedSteps,
      maxStepIndex,
      waitlistSubmitted: completedSteps.includes('email_capture_submitted'),
    });
  }
  return sessions;
}

function sortEvents(
  rows: FunnelEventRow[],
  field: EventSortField,
  direction: SortDirection,
): FunnelEventRow[] {
  const mult = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let av: string | number = '';
    let bv: string | number = '';
    switch (field) {
      case 'created_at':
        av = a.created_at;
        bv = b.created_at;
        break;
      case 'event_name':
        av = a.event_name;
        bv = b.event_name;
        break;
      case 'page_slug':
        av = a.page_slug ?? '';
        bv = b.page_slug ?? '';
        break;
      case 'session_id':
        av = a.session_id;
        bv = b.session_id;
        break;
      case 'tracking_id':
        av = resolveTrackingId(a) ?? '';
        bv = resolveTrackingId(b) ?? '';
        break;
    }
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  });
}

function sortSessions(
  rows: SessionAnalyticsRow[],
  field: SessionSortField,
  direction: SortDirection,
): SessionAnalyticsRow[] {
  const mult = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let av: string | number = 0;
    let bv: string | number = 0;
    switch (field) {
      case 'last_seen':
        av = a.lastSeenAt;
        bv = b.lastSeenAt;
        break;
      case 'first_seen':
        av = a.firstSeenAt;
        bv = b.firstSeenAt;
        break;
      case 'event_count':
        av = a.eventCount;
        bv = b.eventCount;
        break;
      case 'max_step':
        av = a.maxStepIndex;
        bv = b.maxStepIndex;
        break;
    }
    if (av < bv) return -1 * mult;
    if (av > bv) return 1 * mult;
    return 0;
  });
}

function buildBreakdown(
  rows: FunnelEventRow[],
  groupBy: 'page_slug' | 'tracking_id' | 'ab_variant' | 'event_name',
): BreakdownRow[] {
  const sessionVariants =
    groupBy === 'ab_variant' ? buildSessionVariantMap(rows) : new Map<string, AbVariant>();
  const groups = new Map<string, FunnelEventRow[]>();
  for (const r of rows) {
    let key = '';
    switch (groupBy) {
      case 'page_slug':
        key = r.page_slug ?? '(none)';
        break;
      case 'tracking_id':
        key = resolveTrackingId(r) ?? '(none)';
        break;
      case 'ab_variant':
        key = effectiveAbVariant(r, sessionVariants) ?? '(none)';
        break;
      case 'event_name':
        key = r.event_name;
        break;
    }
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const result: BreakdownRow[] = [];
  for (const [key, events] of groups) {
    const sessions = new Set(events.map((e) => e.session_id));
    const submissions = events.filter((e) => e.event_name === 'email_capture_submitted').length;
    const pageViews = events.filter((e) => e.event_name === 'page_view').length;
    const sessionsWithView = new Set(
      events.filter((e) => e.event_name === 'page_view').map((e) => e.session_id),
    );
    result.push({
      key,
      label: key,
      sessions: sessions.size,
      events: events.length,
      submissions,
      conversionRate:
        sessionsWithView.size > 0
          ? (submissions / sessionsWithView.size) * 100
          : pageViews > 0
            ? (submissions / pageViews) * 100
            : 0,
    });
  }

  return result.sort((a, b) => b.sessions - a.sessions);
}

function uniqueSessionsForStep(
  rows: FunnelEventRow[],
  step: FunnelEventName,
  variant: 'A' | 'B',
  sessionVariants: Map<string, AbVariant>,
): number {
  const sessionsWithStep = new Set(
    rows.filter((r) => r.event_name === step).map((r) => r.session_id),
  );
  let count = 0;
  for (const sessionId of sessionsWithStep) {
    if (sessionVariants.get(sessionId) === variant) count++;
  }
  return count;
}

function buildVariantComparison(filtered: FunnelEventRow[]): Omit<VariantComparisonData, 'truncated'> {
  const sessionVariants = buildSessionVariantMap(filtered);
  const funnelByStep: VariantFunnelRow[] = FUNNEL_STEPS.map((step, index) => {
    const sessionsA = uniqueSessionsForStep(filtered, step, 'A', sessionVariants);
    const sessionsB = uniqueSessionsForStep(filtered, step, 'B', sessionVariants);
    const prevStep = index > 0 ? FUNNEL_STEPS[index - 1] : null;
    const prevA = prevStep
      ? uniqueSessionsForStep(filtered, prevStep, 'A', sessionVariants)
      : sessionsA;
    const prevB = prevStep
      ? uniqueSessionsForStep(filtered, prevStep, 'B', sessionVariants)
      : sessionsB;

    return {
      step,
      stepLabel: VARIANT_STEP_LABELS[step],
      sessionsA,
      sessionsB,
      stepConversionA:
        prevStep && prevA > 0 ? (sessionsA / prevA) * 100 : null,
      stepConversionB:
        prevStep && prevB > 0 ? (sessionsB / prevB) * 100 : null,
    };
  });

  const assignedSessionsA = [...sessionVariants.values()].filter((v) => v === 'A').length;
  const assignedSessionsB = [...sessionVariants.values()].filter((v) => v === 'B').length;

  const waitlistSignupsA = uniqueSessionsForStep(
    filtered,
    'email_capture_submitted',
    'A',
    sessionVariants,
  );
  const waitlistSignupsB = uniqueSessionsForStep(
    filtered,
    'email_capture_submitted',
    'B',
    sessionVariants,
  );
  const formShownA = uniqueSessionsForStep(
    filtered,
    'email_capture_shown',
    'A',
    sessionVariants,
  );
  const formShownB = uniqueSessionsForStep(
    filtered,
    'email_capture_shown',
    'B',
    sessionVariants,
  );
  const pageViewsA = uniqueSessionsForStep(filtered, 'page_view', 'A', sessionVariants);
  const pageViewsB = uniqueSessionsForStep(filtered, 'page_view', 'B', sessionVariants);

  return {
    funnelByStep,
    assignedSessionsA,
    assignedSessionsB,
    waitlistSignupsA,
    waitlistSignupsB,
    formToSignupRateA: formShownA > 0 ? (waitlistSignupsA / formShownA) * 100 : null,
    formToSignupRateB: formShownB > 0 ? (waitlistSignupsB / formShownB) * 100 : null,
    pageToSignupRateA: pageViewsA > 0 ? (waitlistSignupsA / pageViewsA) * 100 : null,
    pageToSignupRateB: pageViewsB > 0 ? (waitlistSignupsB / pageViewsB) * 100 : null,
  };
}

export const analyticsExplorerService = {
  async getFilterOptions(range: AnalyticsDateRange): Promise<AnalyticsFilterOptions> {
    const { fromISO, toISO } = filtersToDateRange({
      ...DEFAULT_ANALYTICS_FILTERS(),
      ...range,
    });

    const rows = await fetchEventsInRange(fromISO, toISO);

    const pageSlugs = new Set<string>();
    const trackingIds = new Set<string>();
    const eventNames = new Set<FunnelEventName>();

    for (const r of rows) {
      if (r.page_slug) pageSlugs.add(r.page_slug);
      const tid = resolveTrackingId(r);
      if (tid) trackingIds.add(tid);
      eventNames.add(r.event_name as FunnelEventName);
    }

    return {
      pageSlugs: [...pageSlugs].sort(),
      trackingIds: [...trackingIds].sort(),
      eventNames: [...eventNames].sort() as FunnelEventName[],
    };
  },

  async getOverview(filters: AnalyticsFilters) {
    const { fromISO, toISO } = filtersToDateRange(filters);
    const rows = await fetchEventsInRange(fromISO, toISO);
    const aggregated = buildAggregated(rows, filters);

    const { count: waitlistCount } = await supabase
      .from('waitlist_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fromISO)
      .lte('created_at', toISO);

    return {
      ...aggregated,
      waitlistSubmissions: waitlistCount ?? aggregated.waitlistSubmissions,
      uniqueSessions: new Set(applyClientFilters(rows, filters).map((r) => r.session_id)).size,
    };
  },

  async queryEvents(
    filters: AnalyticsFilters,
    options: {
      page?: number;
      pageSize?: number;
      sortField?: EventSortField;
      sortDirection?: SortDirection;
    } = {},
  ) {
    const { fromISO, toISO } = filtersToDateRange(filters);
    const rows = await fetchEventsInRange(fromISO, toISO);
    const filtered = applyClientFilters(rows, filters);
    const sessionVariants = buildSessionVariantMap(filtered);
    const sorted = sortEvents(
      filtered,
      options.sortField ?? 'created_at',
      options.sortDirection ?? 'desc',
    ).map((r) => ({
      ...r,
      ab_variant: effectiveAbVariant(r, sessionVariants),
    }));

    const pageSize = options.pageSize ?? 50;
    const page = options.page ?? 0;
    const start = page * pageSize;

    return {
      data: sorted.slice(start, start + pageSize),
      count: sorted.length,
      truncated: rows.length >= ANALYTICS_FETCH_LIMIT,
    };
  },

  async querySessions(
    filters: AnalyticsFilters,
    options: {
      page?: number;
      pageSize?: number;
      sortField?: SessionSortField;
      sortDirection?: SortDirection;
    } = {},
  ) {
    const { fromISO, toISO } = filtersToDateRange(filters);
    const rows = await fetchEventsInRange(fromISO, toISO);
    const filtered = applyClientFilters(rows, filters);
    const sessions = buildSessionRows(filtered);
    const sorted = sortSessions(
      sessions,
      options.sortField ?? 'last_seen',
      options.sortDirection ?? 'desc',
    );

    const pageSize = options.pageSize ?? 25;
    const page = options.page ?? 0;
    const start = page * pageSize;

    return {
      data: sorted.slice(start, start + pageSize),
      count: sorted.length,
      truncated: rows.length >= ANALYTICS_FETCH_LIMIT,
    };
  },

  async getVariantComparison(filters: AnalyticsFilters): Promise<VariantComparisonData> {
    const { fromISO, toISO } = filtersToDateRange(filters);
    const rows = await fetchEventsInRange(fromISO, toISO);
    const filtered = applyClientFilters(rows, filters);
    const comparison = buildVariantComparison(filtered);
    return {
      ...comparison,
      truncated: rows.length >= ANALYTICS_FETCH_LIMIT,
    };
  },

  async getBreakdowns(filters: AnalyticsFilters) {
    const { fromISO, toISO } = filtersToDateRange(filters);
    const rows = await fetchEventsInRange(fromISO, toISO);
    const filtered = applyClientFilters(rows, filters);

    return {
      byPage: buildBreakdown(filtered, 'page_slug'),
      byTrackingId: buildBreakdown(filtered, 'tracking_id'),
      byVariant: buildBreakdown(filtered, 'ab_variant'),
      byEvent: buildBreakdown(filtered, 'event_name'),
      truncated: rows.length >= ANALYTICS_FETCH_LIMIT,
    };
  },

  async exportEventsCsv(
    filters: AnalyticsFilters,
    sortField: EventSortField = 'created_at',
    sortDirection: SortDirection = 'desc',
  ): Promise<string> {
    const { fromISO, toISO } = filtersToDateRange(filters);
    const rows = await fetchEventsInRange(fromISO, toISO);
    const filtered = applyClientFilters(rows, filters);
    const sessionVariants = buildSessionVariantMap(filtered);
    const sorted = sortEvents(filtered, sortField, sortDirection);

    const header = [
      'created_at',
      'event_name',
      'session_id',
      'tracking_id',
      'page_slug',
      'ab_variant',
      'conversation_id',
    ].join(',');

    const lines = sorted.map((r) =>
      [
        r.created_at,
        r.event_name,
        r.session_id,
        resolveTrackingId(r) ?? '',
        r.page_slug ?? '',
        effectiveAbVariant(r, sessionVariants) ?? '',
        r.conversation_id ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );

    return [header, ...lines].join('\n');
  },
};
