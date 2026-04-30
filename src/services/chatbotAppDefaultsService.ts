import { supabase } from '@/integrations/supabase/client';
import type { AIProvider } from '@/utils/modelConfig'; // type-only — avoids circular import with modelConfig

const ROW_ID = 1;

export interface ChatbotAppDefaultsRow {
  default_chat_provider: AIProvider;
  default_chat_model_id: string;
  updated_at: string;
}

export const chatbotAppDefaultsService = {
  async getDefaults(): Promise<ChatbotAppDefaultsRow | null> {
    const { data, error } = await supabase
      .from('chatbot_app_defaults')
      .select('default_chat_provider, default_chat_model_id, updated_at')
      .eq('id', ROW_ID)
      .maybeSingle();

    if (error) {
      console.error('[chatbotAppDefaults]', error.message);
      return null;
    }
    if (!data) return null;
    return data as ChatbotAppDefaultsRow;
  },

  async updateDefaultModel(
    provider: AIProvider,
    modelId: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase
      .from('chatbot_app_defaults')
      .update({
        default_chat_provider: provider,
        default_chat_model_id: modelId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ROW_ID);

    if (error) {
      console.error('[chatbotAppDefaults] update', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  },
};
