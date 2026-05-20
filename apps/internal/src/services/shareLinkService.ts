import { supabase } from '@goldfish/shared/integrations/supabase/client';
import { getSessionId } from '@/services/chatbotConversationService';
import {
  hasRecordedVisitForSession,
  markVisitRecordedForSession,
} from '@/utils/trackingId';
import { FUNNEL_STEPS, type FunnelEventName } from '@/services/analyticsService';

export interface ShareLink {
  id: string;
  label: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShareLinkVisit {
  id: string;
  tracking_id: string;
  session_id: string;
  page_slug: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ShareLinkVisitorEvent {
  eventName: FunnelEventName;
  createdAt: string;
  pageSlug: string | null;
  conversationId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ShareLinkVisitor {
  sessionId: string;
  firstSeenAt: string;
  lastSeenAt: string;
  landingPages: string[];
  conversationId: string | null;
  waitlistName: string | null;
  waitlistEmail: string | null;
  events: ShareLinkVisitorEvent[];
  completedSteps: FunnelEventName[];
  messageCount: number;
}

export interface ShareLinkAnalytics {
  trackingId: string;
  label: string | null;
  notes: string | null;
  isRegistered: boolean;
  opened: boolean;
  visitCount: number;
  uniqueSessions: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  funnelCounts: Partial<Record<FunnelEventName, number>>;
  visitorCount: number;
}

type FunnelRow = {
  event_name: string;
  session_id: string;
  tracking_id: string | null;
  conversation_id: string | null;
  page_slug: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function resolveTrackingId(row: FunnelRow): string | null {
  if (row.tracking_id) return row.tracking_id;
  const fromMeta = row.metadata?.trackingId;
  return typeof fromMeta === 'string' ? fromMeta : null;
}

/**
 * Fire-and-forget: records a landing-page open for this tracking id (once per browser session).
 */
export function recordShareLinkVisit(trackingId: string, pageSlug: string) {
  if (hasRecordedVisitForSession(trackingId)) return;
  markVisitRecordedForSession(trackingId);

  const row = {
    tracking_id: trackingId,
    session_id: getSessionId(),
    page_slug: pageSlug,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  };

  supabase
    .from('share_link_visits')
    .insert(row)
    .then(({ error }) => {
      if (error) console.error('[shareLink] visit', error.message);
    });
}

function aggregateVisits(visits: ShareLinkVisit[]) {
  const byTracking = new Map<string, ShareLinkVisit[]>();
  for (const v of visits) {
    const list = byTracking.get(v.tracking_id) ?? [];
    list.push(v);
    byTracking.set(v.tracking_id, list);
  }
  return byTracking;
}

function aggregateFunnel(events: FunnelRow[]) {
  const byTracking = new Map<string, Partial<Record<FunnelEventName, number>>>();
  for (const e of events) {
    const id = resolveTrackingId(e);
    if (!id) continue;
    const counts = byTracking.get(id) ?? {};
    const name = e.event_name as FunnelEventName;
    counts[name] = (counts[name] ?? 0) + 1;
    byTracking.set(id, counts);
  }
  return byTracking;
}

function buildVisitors(
  trackingId: string,
  visits: ShareLinkVisit[],
  events: FunnelRow[],
  waitlistBySession: Map<string, { name: string; email: string }>,
): ShareLinkVisitor[] {
  const sessions = new Set<string>();
  for (const v of visits) {
    if (v.tracking_id === trackingId) sessions.add(v.session_id);
  }
  for (const e of events) {
    if (resolveTrackingId(e) === trackingId) sessions.add(e.session_id);
  }

  const visitors: ShareLinkVisitor[] = [];

  for (const sessionId of sessions) {
    const sessionVisits = visits.filter(
      (v) => v.tracking_id === trackingId && v.session_id === sessionId,
    );
    const sessionEvents = events
      .filter((e) => e.session_id === sessionId && resolveTrackingId(e) === trackingId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    const timestamps = [
      ...sessionVisits.map((v) => v.created_at),
      ...sessionEvents.map((e) => e.created_at),
    ].sort();

    const landingPages = [
      ...new Set(
        sessionVisits
          .map((v) => v.page_slug)
          .filter((p): p is string => !!p),
      ),
    ];

    const mappedEvents: ShareLinkVisitorEvent[] = sessionEvents.map((e) => ({
      eventName: e.event_name as FunnelEventName,
      createdAt: e.created_at,
      pageSlug: e.page_slug,
      conversationId: e.conversation_id,
      metadata: e.metadata,
    }));

    const completedSteps = FUNNEL_STEPS.filter((step) =>
      mappedEvents.some((ev) => ev.eventName === step),
    );

    const conversationId =
      [...mappedEvents]
        .reverse()
        .find((e) => e.conversationId)?.conversationId ?? null;

    const messageCount = mappedEvents.filter((e) => e.eventName === 'message_sent').length;

    const waitlist = waitlistBySession.get(sessionId);

    visitors.push({
      sessionId,
      firstSeenAt: timestamps[0] ?? new Date().toISOString(),
      lastSeenAt: timestamps[timestamps.length - 1] ?? timestamps[0] ?? new Date().toISOString(),
      landingPages,
      conversationId,
      waitlistName: waitlist?.name ?? null,
      waitlistEmail: waitlist?.email ?? null,
      events: mappedEvents,
      completedSteps,
      messageCount,
    });
  }

  return visitors.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export const shareLinkService = {
  async listLinks(): Promise<ShareLink[]> {
    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async createLink(input: {
    id: string;
    label?: string | null;
    notes?: string | null;
  }): Promise<ShareLink> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('share_links')
      .insert({
        id: input.id,
        label: input.label ?? null,
        notes: input.notes ?? null,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateLink(
    id: string,
    updates: { label?: string | null; notes?: string | null },
  ): Promise<ShareLink> {
    const { data, error } = await supabase
      .from('share_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLink(id: string): Promise<void> {
    const { error } = await supabase.from('share_links').delete().eq('id', id);
    if (error) throw error;
  },

  async getLinkVisitors(trackingId: string): Promise<ShareLinkVisitor[]> {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [visitsResult, funnelResult] = await Promise.all([
      supabase
        .from('share_link_visits')
        .select('*')
        .eq('tracking_id', trackingId)
        .gte('created_at', since)
        .order('created_at', { ascending: true }),
      supabase
        .from('funnel_events')
        .select(
          'event_name, session_id, tracking_id, conversation_id, page_slug, metadata, created_at',
        )
        .or(`tracking_id.eq.${trackingId},metadata->>trackingId.eq.${trackingId}`)
        .gte('created_at', since)
        .order('created_at', { ascending: true }),
    ]);

    if (visitsResult.error) throw visitsResult.error;
    if (funnelResult.error) throw funnelResult.error;

    const visits = (visitsResult.data ?? []) as ShareLinkVisit[];
    const events = (funnelResult.data ?? []) as FunnelRow[];

    const sessionIds = [...new Set(events.map((e) => e.session_id))];
    const waitlistBySession = new Map<string, { name: string; email: string }>();

    if (sessionIds.length > 0) {
      const { data: waitlistRows, error: waitlistError } = await supabase
        .from('waitlist_submissions')
        .select('session_id, name, email')
        .in('session_id', sessionIds);
      if (waitlistError) throw waitlistError;
      for (const row of waitlistRows ?? []) {
        if (row.session_id) {
          waitlistBySession.set(row.session_id, {
            name: row.name,
            email: row.email,
          });
        }
      }
    }

    return buildVisitors(trackingId, visits, events, waitlistBySession);
  },

  async getAnalytics(): Promise<ShareLinkAnalytics[]> {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [linksResult, visitsResult, funnelResult] = await Promise.all([
      supabase.from('share_links').select('*'),
      supabase
        .from('share_link_visits')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('funnel_events')
        .select('event_name, session_id, tracking_id, metadata')
        .gte('created_at', since),
    ]);

    if (linksResult.error) throw linksResult.error;
    if (visitsResult.error) throw visitsResult.error;
    if (funnelResult.error) throw funnelResult.error;

    const links = linksResult.data ?? [];
    const visits = (visitsResult.data ?? []) as ShareLinkVisit[];
    const funnelEvents = (funnelResult.data ?? []) as FunnelRow[];

    const visitsById = aggregateVisits(visits);
    const funnelById = aggregateFunnel(funnelEvents);

    const sessionCountByTracking = new Map<string, Set<string>>();
    for (const e of funnelEvents) {
      const id = resolveTrackingId(e);
      if (!id) continue;
      const set = sessionCountByTracking.get(id) ?? new Set();
      set.add(e.session_id);
      sessionCountByTracking.set(id, set);
    }
    for (const v of visits) {
      const set = sessionCountByTracking.get(v.tracking_id) ?? new Set();
      set.add(v.session_id);
      sessionCountByTracking.set(v.tracking_id, set);
    }

    const allIds = new Set<string>([
      ...links.map((l) => l.id),
      ...visits.map((v) => v.tracking_id),
      ...funnelById.keys(),
    ]);

    const linkById = new Map(links.map((l) => [l.id, l]));

    return [...allIds].map((trackingId) => {
      const link = linkById.get(trackingId);
      const idVisits = visitsById.get(trackingId) ?? [];
      const sessions = new Set(idVisits.map((v) => v.session_id));
      const timestamps = idVisits.map((v) => v.created_at).sort();
      const funnelSessions = sessionCountByTracking.get(trackingId);

      return {
        trackingId,
        label: link?.label ?? null,
        notes: link?.notes ?? null,
        isRegistered: !!link,
        opened: idVisits.length > 0 || (funnelSessions?.size ?? 0) > 0,
        visitCount: idVisits.length,
        uniqueSessions: Math.max(sessions.size, funnelSessions?.size ?? 0),
        firstOpenedAt: timestamps[0] ?? null,
        lastOpenedAt: timestamps[timestamps.length - 1] ?? null,
        funnelCounts: funnelById.get(trackingId) ?? {},
        visitorCount: funnelSessions?.size ?? sessions.size,
      };
    }).sort((a, b) => {
      const aTime = a.lastOpenedAt ?? a.firstOpenedAt ?? '';
      const bTime = b.lastOpenedAt ?? b.firstOpenedAt ?? '';
      if (aTime !== bTime) return bTime.localeCompare(aTime);
      return (a.label ?? a.trackingId).localeCompare(b.label ?? b.trackingId);
    });
  },
};
