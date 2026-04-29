import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from './chatbotConversationService';
import { EmailCaptureVariant } from '@/utils/abTest';

/**
 * Funnel event names — ordered by expected funnel position.
 *
 *  page_view  →  chat_started  →  message_sent (repeated)
 *     →  conversation_complete  →  email_capture_shown
 *     →  email_capture_submitted
 */
export type FunnelEventName =
  | 'page_view'
  | 'chat_started'
  | 'message_sent'
  | 'conversation_complete'
  | 'email_capture_shown'
  | 'email_capture_submitted';

export const FUNNEL_STEPS: FunnelEventName[] = [
  'page_view',
  'chat_started',
  'message_sent',
  'conversation_complete',
  'email_capture_shown',
  'email_capture_submitted',
];

interface TrackOptions {
  conversationId?: string | null;
  variant?: EmailCaptureVariant | null;
  pageSlug?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget: logs an event to `funnel_events`.
 * Never throws — analytics must not break the user experience.
 */
export function trackEvent(
  eventName: FunnelEventName,
  options: TrackOptions = {},
) {
  const row = {
    event_name: eventName,
    session_id: getSessionId(),
    conversation_id: options.conversationId ?? null,
    ab_variant: options.variant ?? null,
    page_slug: options.pageSlug ?? null,
    metadata: options.metadata ?? {},
  };

  supabase
    .from('funnel_events')
    .insert(row)
    .then(({ error }) => {
      if (error) console.error('[analytics]', eventName, error.message);
    });
}
