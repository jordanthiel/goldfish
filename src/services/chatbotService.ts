import { chatbotPromptService } from './chatbotPromptService';
import { supabase } from '@/integrations/supabase/client';
import { getSelectedModel, ModelConfig } from '@/utils/modelConfig';

// Cache for system prompt to avoid fetching on every message
let cachedSystemPrompt: string | null = null;
let promptCacheTime: number = 0;
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

// Get cached or fresh system prompt
const getCachedSystemPrompt = async (): Promise<string> => {
  // Check for custom prompt first (always takes priority)
  const customPrompt = getCustomPrompt();
  if (customPrompt) {
    return customPrompt;
  }
  
  // Check if cache is still valid
  const now = Date.now();
  if (cachedSystemPrompt && (now - promptCacheTime) < PROMPT_CACHE_TTL) {
    return cachedSystemPrompt;
  }
  
  // Fetch fresh prompt
  const prompt = await chatbotPromptService.getActivePrompt();
  cachedSystemPrompt = prompt;
  promptCacheTime = now;
  
  return prompt;
};

// Clear prompt cache (call when prompt is updated)
export const clearPromptCache = () => {
  cachedSystemPrompt = null;
  promptCacheTime = 0;
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatbotResponse {
  message: string;
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
    modelConfig?: ModelConfig
  ): Promise<ChatbotResponse> => {
    try {
      // Get the cached/custom system prompt (much faster than fetching every time)
      const systemPrompt = await getCachedSystemPrompt();

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

      return {
        message: responseData.message,
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
      };
    }
  },
};
