import { supabase } from '@/integrations/supabase/client';

export interface ChatbotPrompt {
  id: string;
  prompt_name: string;
  system_prompt: string;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const chatbotPromptService = {
  // Get the active prompt for therapist discovery
  getActivePrompt: async (promptName: string = 'therapist_discovery'): Promise<string> => {
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('system_prompt')
      .eq('prompt_name', promptName)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching chatbot prompt:', error);
      // Return default prompt if database fetch fails
      return 'You are a compassionate assistant helping users find the right therapist.';
    }

    return data?.system_prompt || 'You are a compassionate assistant helping users find the right therapist.';
  },

  // Get all prompts (for dev mode)
  getAllPrompts: async (promptName: string = 'therapist_discovery'): Promise<ChatbotPrompt[]> => {
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('*')
      .eq('prompt_name', promptName)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }

    return data || [];
  },

  // Get the latest prompt (active or not)
  getLatestPrompt: async (promptName: string = 'therapist_discovery'): Promise<ChatbotPrompt | null> => {
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('*')
      .eq('prompt_name', promptName)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching latest prompt:', error);
      return null;
    }

    return data;
  },

  // Create a new prompt version
  createPrompt: async (
    promptName: string,
    systemPrompt: string,
    userId?: string,
    isActive: boolean = true
  ): Promise<ChatbotPrompt | null> => {
    // If making this active, deactivate all existing prompts for this name
    if (isActive) {
      await supabase
        .from('chatbot_prompts')
        .update({ is_active: false })
        .eq('prompt_name', promptName);
    }

    // Get the latest version number
    const { data: latest } = await supabase
      .from('chatbot_prompts')
      .select('version')
      .eq('prompt_name', promptName)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = latest ? latest.version + 1 : 1;

    // Create new prompt
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .insert({
        prompt_name: promptName,
        system_prompt: systemPrompt,
        version: nextVersion,
        is_active: isActive,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      return null;
    }

    return data;
  },

  // Update an existing prompt
  updatePrompt: async (
    id: string,
    systemPrompt: string
  ): Promise<ChatbotPrompt | null> => {
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .update({
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating prompt:', error);
      return null;
    }

    return data;
  },

  // Activate a specific version (restore it)
  activateVersion: async (
    id: string,
    promptName: string = 'therapist_discovery'
  ): Promise<ChatbotPrompt | null> => {
    // First, deactivate all existing prompts for this name
    await supabase
      .from('chatbot_prompts')
      .update({ is_active: false })
      .eq('prompt_name', promptName);

    // Activate the specified version
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error activating prompt version:', error);
      return null;
    }

    return data;
  },
};
