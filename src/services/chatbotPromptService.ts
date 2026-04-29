import { supabase } from '@/integrations/supabase/client';
import { landingPageService } from './landingPageService';

export interface ChatbotPrompt {
  id: string;
  prompt_name: string;
  system_prompt: string;
  initial_greeting: string;
  version: number;
  is_active: boolean;
  page_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SYSTEM_PROMPT = 'You are a compassionate assistant helping users find the right therapist.';

// Resolve a page slug to a page_id (with fallback to 'default')
async function resolvePageId(pageSlug?: string): Promise<string | null> {
  const slug = pageSlug || 'default';
  return await landingPageService.getPageId(slug);
}

export const chatbotPromptService = {
  // Get the active system prompt for a page (by slug)
  getActivePrompt: async (pageSlug?: string): Promise<string> => {
    const pageId = await resolvePageId(pageSlug);

    if (pageId) {
      const { data, error } = await supabase
        .from('chatbot_prompts')
        .select('system_prompt')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (!error && data?.system_prompt) {
        return data.system_prompt;
      }
    }

    // Fallback: try by prompt_name for backward compat
    const promptName = pageSlug || 'therapist_discovery';
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

  /** Active prompt version number (for export / metadata). */
  getActivePromptVersion: async (pageSlug?: string): Promise<number | null> => {
    const pageId = await resolvePageId(pageSlug);

    if (pageId) {
      const { data, error } = await supabase
        .from('chatbot_prompts')
        .select('version')
        .eq('page_id', pageId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) return data.version ?? null;
    }

    const promptName = pageSlug || 'therapist_discovery';
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('version')
      .eq('prompt_name', promptName)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching prompt version:', error);
      return null;
    }

    return data?.version ?? null;
  },

  // Get all prompts for a page (for prompt editor / dev mode)
  getAllPrompts: async (pageSlug?: string): Promise<ChatbotPrompt[]> => {
    const pageId = await resolvePageId(pageSlug);

    if (pageId) {
      const { data, error } = await supabase
        .from('chatbot_prompts')
        .select('*')
        .eq('page_id', pageId)
        .order('version', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as ChatbotPrompt[];
      }
    }

    // Fallback
    const promptName = pageSlug || 'therapist_discovery';
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .select('*')
      .eq('prompt_name', promptName)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
      return [];
    }

    return (data || []) as ChatbotPrompt[];
  },

  // Get the latest prompt (active or not)
  getLatestPrompt: async (pageSlug?: string): Promise<ChatbotPrompt | null> => {
    const pageId = await resolvePageId(pageSlug);

    if (pageId) {
      const { data, error } = await supabase
        .from('chatbot_prompts')
        .select('*')
        .eq('page_id', pageId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return data as ChatbotPrompt;
      }
    }

    // Fallback
    const promptName = pageSlug || 'therapist_discovery';
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

    return data as ChatbotPrompt;
  },

  // Create a new prompt version for a page
  createPrompt: async (
    pageSlug: string,
    systemPrompt: string,
    userId?: string,
    isActive: boolean = true
  ): Promise<ChatbotPrompt | null> => {
    const pageId = await resolvePageId(pageSlug);

    if (!pageId) {
      console.error('Landing page not found for slug:', pageSlug);
      return null;
    }

    // If making this active, deactivate all existing prompts for this page
    if (isActive) {
      await supabase
        .from('chatbot_prompts')
        .update({ is_active: false })
        .eq('page_id', pageId);
    }

    // Get the latest version number for this page
    const { data: latest } = await supabase
      .from('chatbot_prompts')
      .select('version')
      .eq('page_id', pageId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = latest ? latest.version + 1 : 1;

    // Create new prompt
    const { data, error } = await supabase
      .from('chatbot_prompts')
      .insert({
        prompt_name: pageSlug,  // Keep prompt_name in sync with slug for backward compat
        system_prompt: systemPrompt,
        initial_greeting: '',
        version: nextVersion,
        is_active: isActive,
        page_id: pageId,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt:', error);
      return null;
    }

    return data as ChatbotPrompt;
  },

  // Update an existing prompt
  updatePrompt: async (id: string, systemPrompt: string): Promise<ChatbotPrompt | null> => {
    const updateData: Record<string, unknown> = {
      system_prompt: systemPrompt,
      updated_at: new Date().toISOString(),
    };

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

    return data as ChatbotPrompt;
  },

  // Activate a specific version (deactivates others for the same page)
  activateVersion: async (
    id: string,
    pageSlug?: string
  ): Promise<ChatbotPrompt | null> => {
    // First, get the prompt to find its page_id
    const { data: prompt } = await supabase
      .from('chatbot_prompts')
      .select('page_id, prompt_name')
      .eq('id', id)
      .single();

    if (!prompt) {
      console.error('Prompt not found:', id);
      return null;
    }

    // Deactivate all prompts for this page
    if (prompt.page_id) {
      await supabase
        .from('chatbot_prompts')
        .update({ is_active: false })
        .eq('page_id', prompt.page_id);
    } else {
      // Fallback: deactivate by prompt_name
      const name = pageSlug || prompt.prompt_name || 'therapist_discovery';
      await supabase
        .from('chatbot_prompts')
        .update({ is_active: false })
        .eq('prompt_name', name);
    }

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

    return data as ChatbotPrompt;
  },
};
