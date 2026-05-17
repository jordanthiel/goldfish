import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/services/chatbotConversationService';
import {
  hasRecordedVisitForSession,
  markVisitRecordedForSession,
} from '@/utils/trackingId';
import type { FunnelEventName } from '@/services/analyticsService';

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

function aggregateFunnel(
  events: Array<{ event_name: string; metadata: Record<string, unknown> | null }>,
) {
  const byTracking = new Map<string, Partial<Record<FunnelEventName, number>>>();
  for (const e of events) {
    const id = e.metadata?.trackingId;
    if (typeof id !== 'string') continue;
    const counts = byTracking.get(id) ?? {};
    const name = e.event_name as FunnelEventName;
    counts[name] = (counts[name] ?? 0) + 1;
    byTracking.set(id, counts);
  }
  return byTracking;
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

  async getAnalytics(): Promise<ShareLinkAnalytics[]> {
    const [linksResult, visitsResult, funnelResult] = await Promise.all([
      supabase.from('share_links').select('*'),
      supabase
        .from('share_link_visits')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('funnel_events')
        .select('event_name, metadata')
        .gte(
          'created_at',
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        ),
    ]);

    if (linksResult.error) throw linksResult.error;
    if (visitsResult.error) throw visitsResult.error;
    if (funnelResult.error) throw funnelResult.error;

    const links = linksResult.data ?? [];
    const visits = (visitsResult.data ?? []) as ShareLinkVisit[];
    const funnelEvents = funnelResult.data ?? [];

    const visitsById = aggregateVisits(visits);
    const funnelWithTracking = (
      funnelEvents as Array<{
        event_name: string;
        metadata: Record<string, unknown> | null;
      }>
    ).filter((e) => typeof e.metadata?.trackingId === 'string');

    const funnelById = aggregateFunnel(funnelWithTracking);

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

      return {
        trackingId,
        label: link?.label ?? null,
        notes: link?.notes ?? null,
        isRegistered: !!link,
        opened: idVisits.length > 0,
        visitCount: idVisits.length,
        uniqueSessions: sessions.size,
        firstOpenedAt: timestamps[0] ?? null,
        lastOpenedAt: timestamps[timestamps.length - 1] ?? null,
        funnelCounts: funnelById.get(trackingId) ?? {},
      };
    }).sort((a, b) => {
      const aTime = a.lastOpenedAt ?? a.firstOpenedAt ?? '';
      const bTime = b.lastOpenedAt ?? b.firstOpenedAt ?? '';
      if (aTime !== bTime) return bTime.localeCompare(aTime);
      return (a.label ?? a.trackingId).localeCompare(b.label ?? b.trackingId);
    });
  },
};
