import { supabase } from '@/integrations/supabase/client';

export interface ChatbotPrompt {
  id: string;
  prompt_name: string;
  system_prompt: string;
  initial_greeting: string;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Default values
const DEFAULT_GREETING = "Hi! I'm here to help you find a therapist who truly understands you. Let's start by getting to know you a bit. What brings you here today?";
const DEFAULT_SYSTEM_PROMPT = 'You are a compassionate assistant helping users find the right therapist.';

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
      return DEFAULT_SYSTEM_PROMPT;
    }

    return data?.system_prompt || DEFAULT_SYSTEM_PROMPT;
  },

  // Get the active greeting for therapist discovery
  getActiveGreeting: async (promptName: string = 'therapist_discovery'): Promise<string> => {
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('initial_greeting')
      .eq('prompt_name', promptName)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching chatbot greeting:', error);
      return DEFAULT_GREETING;
    }

    return data?.initial_greeting || DEFAULT_GREETING;
  },

  // Get the active greeting with version number
  getActiveGreetingWithVersion: async (promptName: string = 'therapist_discovery'): Promise<{ greeting: string; version: number | null }> => {
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('initial_greeting, version')
      .eq('prompt_name', promptName)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching chatbot greeting:', error);
      return { greeting: DEFAULT_GREETING, version: null };
    }

    return {
      greeting: data?.initial_greeting || DEFAULT_GREETING,
      version: data?.version ?? null,
    };
  },

  // Get the active prompt with greeting (combined)
  getActivePromptWithGreeting: async (promptName: string = 'therapist_discovery'): Promise<{ systemPrompt: string; greeting: string }> => {
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('system_prompt, initial_greeting')
      .eq('prompt_name', promptName)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching chatbot prompt:', error);
      return { systemPrompt: DEFAULT_SYSTEM_PROMPT, greeting: DEFAULT_GREETING };
    }

    return {
      systemPrompt: data?.system_prompt || DEFAULT_SYSTEM_PROMPT,
      greeting: data?.initial_greeting || DEFAULT_GREETING,
    };
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
    initialGreeting: string,
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
        initial_greeting: initialGreeting,
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
    systemPrompt: string,
    initialGreeting?: string
  ): Promise<ChatbotPrompt | null> => {
    const updateData: Record<string, unknown> = {
      system_prompt: systemPrompt,
      updated_at: new Date().toISOString(),
    };
    
    if (initialGreeting !== undefined) {
      updateData.initial_greeting = initialGreeting;
    }

    const { data, error } = await supabase
      .from('chatbot_prompts')
      .update(updateData)
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
