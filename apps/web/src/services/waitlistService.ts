import { supabase } from '@goldfish/shared/integrations/supabase/client';
import { EmailCaptureVariant } from '@/utils/abTest';
import { getSessionId } from './chatbotConversationService';

export interface WaitlistSubmission {
  name: string;
  email: string;
  variant: EmailCaptureVariant;
  conversationId?: string | null;
  pageSlug?: string;
}

/**
 * Resolves the chat conversation to link at signup time.
 * Uses explicit id from the chat UI when available, otherwise the latest
 * conversation for this browser session (anonymous users).
 */
export async function resolveWaitlistConversationId(
  explicitConversationId?: string | null,
): Promise<string | null> {
  if (explicitConversationId) {
    return explicitConversationId;
  }

  const sessionId = getSessionId();
  const { data, error } = await supabase
    .from('chatbot_conversations')
    .select('id')
    .eq('session_id', sessionId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[waitlist] resolve conversation', error.message);
    return null;
  }

  return data?.id ?? null;
}

export const waitlistService = {
  submit: async (submission: WaitlistSubmission): Promise<boolean> => {
    try {
      const linkedConversationId = await resolveWaitlistConversationId(
        submission.conversationId,
      );

      const { error } = await supabase.from('waitlist_submissions').insert({
        name: submission.name,
        email: submission.email,
        ab_variant: submission.variant,
        conversation_id: linkedConversationId,
        linked_conversation_id: linkedConversationId,
        session_id: getSessionId(),
        page_slug: submission.pageSlug ?? null,
      });

      if (error) {
        console.error('Error submitting to waitlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in waitlist submission:', error);
      return false;
    }
  },
};
