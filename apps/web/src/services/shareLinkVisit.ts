import { supabase } from '@goldfish/shared/integrations/supabase/client';
import { getSessionId } from '@/services/chatbotConversationService';
import {
  hasRecordedVisitForSession,
  markVisitRecordedForSession,
} from '@/utils/trackingId';

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
