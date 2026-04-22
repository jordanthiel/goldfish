import { supabase } from '@/integrations/supabase/client';
import { EmailCaptureVariant } from '@/utils/abTest';
import { getSessionId } from './chatbotConversationService';

export interface WaitlistSubmission {
  name: string;
  email: string;
  variant: EmailCaptureVariant;
  conversationId?: string | null;
  pageSlug?: string;
}

export const waitlistService = {
  submit: async (submission: WaitlistSubmission): Promise<boolean> => {
    try {
      const { error } = await supabase.from('waitlist_submissions').insert({
        name: submission.name,
        email: submission.email,
        ab_variant: submission.variant,
        conversation_id: submission.conversationId ?? null,
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
