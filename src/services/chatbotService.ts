import { chatbotPromptService } from './chatbotPromptService';
import { supabase } from '@/integrations/supabase/client';
import { getSelectedModel, ModelConfig } from '@/utils/modelConfig';

// Cache for system prompts to avoid fetching on every message (keyed by page slug)
const promptCache: Map<string, { prompt: string; time: number }> = new Map();
const PROMPT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get custom prompt from localStorage
const getCustomPrompt = (): string | null => {
  try {
    const useCustom = localStorage.getItem('chatbot_use_custom_prompt');
    if (useCustom === 'true') {
      return localStorage.getItem('chatbot_custom_prompt');
    }
  } catch (error) {
    console.error('Error loading custom prompt:', error);
  }
  return null;
};

// Get cached or fresh system prompt for a given page slug
const getCachedSystemPrompt = async (pageSlug: string = 'default'): Promise<string> => {
  // Check for custom prompt first (always takes priority)
  const customPrompt = getCustomPrompt();
  if (customPrompt) {
    return customPrompt;
  }
  
  // Check if cache is still valid for this page slug
  const now = Date.now();
  const cached = promptCache.get(pageSlug);
  if (cached && (now - cached.time) < PROMPT_CACHE_TTL) {
    return cached.prompt;
  }
  
  // Fetch fresh prompt by page slug
  const prompt = await chatbotPromptService.getActivePrompt(pageSlug);
  promptCache.set(pageSlug, { prompt, time: now });
  
  return prompt;
};

// Clear prompt cache (call when prompt is updated)
export const clearPromptCache = () => {
  promptCache.clear();
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** Set when assistant response ended with [CONVERSATION_COMPLETE]; persisted so post-navigate/remount restores completion UI */
  marksConversationComplete?: boolean;
}

export const CONVERSATION_COMPLETE_MARKER = '[CONVERSATION_COMPLETE]';

export interface ChatbotResponse {
  message: string;
  conversationComplete: boolean;
  deviceInfo?: {
    ip_address?: string;
    user_agent?: string;
    location?: string;
  };
}

export const chatbotService = {
  // Send a message to the chatbot and get a response
  sendMessage: async (
    messages: ChatMessage[],
    modelConfig?: ModelConfig,
    pageSlug?: string
  ): Promise<ChatbotResponse> => {
    try {
      const systemPrompt = await getCachedSystemPrompt(pageSlug);

      // Get model configuration (use provided or get from storage)
      const selectedModel = modelConfig || getSelectedModel();

      // Get Supabase URL and anon key for direct fetch
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token 
        ? `Bearer ${session.access_token}`
        : `Bearer ${supabaseAnonKey}`;

      // Call Supabase Edge Function directly using fetch for better error handling
      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt,
          provider: selectedModel.provider,
          modelId: selectedModel.modelId,
        }),
      });

      // Parse response
      const responseData = await response.json();

      // Check if response is an error (non-2xx status or error in body)
      if (!response.ok || responseData.error) {
        const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      if (!responseData || !responseData.message) {
        throw new Error('Invalid response from chatbot');
      }

      const rawMessage: string = responseData.message;
      const conversationComplete = rawMessage.includes(CONVERSATION_COMPLETE_MARKER);
      const cleanMessage = rawMessage.replace(CONVERSATION_COMPLETE_MARKER, '').trim();

      return {
        message: cleanMessage,
        conversationComplete,
        deviceInfo: responseData.deviceInfo,
      };
    } catch (error) {
      console.error('Error in chatbot service:', error);
      
      // Return the actual error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while processing your request.';
      
      return {
        message: `I'm sorry, but I encountered an error: ${errorMessage}. Please try again.`,
        conversationComplete: false,
      };
    }
  },
};
