import { chatbotPromptService } from './chatbotPromptService';
import { Therapist } from '@/types/therapist';
import { therapistDiscoveryService } from './therapistDiscoveryService';
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
  matchedTherapists?: Therapist[];
}

export interface ChatbotResponse {
  message: string;
  matchedTherapists?: Therapist[];
  isComplete?: boolean;
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
    therapists: Therapist[],
    modelConfig?: ModelConfig
  ): Promise<ChatbotResponse> => {
    try {
      // Get the cached/custom system prompt (much faster than fetching every time)
      const systemPrompt = await getCachedSystemPrompt();

      // Prepare messages for OpenAI API
      const apiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ];

      // Add therapist data to the system prompt context
      const therapistContext = `
Available therapists (with IDs):
${therapists.map(t => `
ID: ${t.id}
- ${t.firstName} ${t.lastName} (${t.age} years old)
  Specialties: ${t.specialties.join(', ')}
  Location: ${t.location}
  Bio: ${t.bio}
  Accepting new clients: ${t.acceptingNewClients ? 'Yes' : 'No'}
  Virtual sessions: ${t.offersVirtual ? 'Yes' : 'No'}
  Years of experience: ${t.yearsOfExperience}
  Rating: ${t.rating}/5
`).join('\n')}

MATCHING GUIDELINES:
- For in-person sessions: Location matching is CRITICAL. Only recommend therapists in the same city/area as the user.
- For virtual sessions: Location is less important, but you can still consider timezone compatibility.
- Match based on specialties that align with the user''s concerns.
- Consider therapist age, cultural background, and other preferences the user has shared.
- Prioritize therapists who are accepting new clients.
- Match 3-5 therapists that best fit the user''s needs and preferences.

IMPORTANT FORMATTING: When you have gathered enough information and are ready to recommend therapists, respond with your message followed by a JSON object on a new line with the format:
THERAPIST_RECOMMENDATIONS: {"therapistIds": ["id1", "id2", "id3"]}

Only include the THERAPIST_RECOMMENDATIONS JSON when you are actually recommending specific therapists (3-5 therapists). Do not include therapist details in your text response - just provide a warm, conversational message and the JSON object with therapist IDs.
`.trim();

      const enhancedSystemPrompt = `${systemPrompt}\n\n${therapistContext}`;
      apiMessages[0].content = enhancedSystemPrompt;

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
          messages: apiMessages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: enhancedSystemPrompt,
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

      const data = responseData;

      // Extract therapist recommendations from structured response
      const { message, matchedTherapists } = parseChatbotResponse(data.message, therapists);

      return {
        message,
        matchedTherapists: matchedTherapists.length > 0 ? matchedTherapists : undefined,
        isComplete: matchedTherapists.length > 0,
        deviceInfo: data.deviceInfo, // Pass device info back for saving
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

// Helper function to parse chatbot response and extract therapist recommendations
function parseChatbotResponse(
  aiResponse: string,
  therapists: Therapist[]
): { message: string; matchedTherapists: Therapist[] } {
  // Look for the THERAPIST_RECOMMENDATIONS JSON object
  const recommendationsMatch = aiResponse.match(/THERAPIST_RECOMMENDATIONS:\s*(\{.*?\})/s);
  
  let matchedTherapists: Therapist[] = [];
  let message = aiResponse;

  if (recommendationsMatch) {
    try {
      const recommendationsJson = recommendationsMatch[1];
      const recommendations = JSON.parse(recommendationsJson);
      
      if (recommendations.therapistIds && Array.isArray(recommendations.therapistIds)) {
        // Find therapists by their IDs
        matchedTherapists = recommendations.therapistIds
          .map((id: string) => therapists.find(t => t.id === id))
          .filter((t): t is Therapist => t !== undefined)
          .slice(0, 5); // Limit to 5
        
        // Remove the JSON recommendation line from the message
        message = aiResponse.replace(/THERAPIST_RECOMMENDATIONS:\s*\{.*?\}/s, '').trim();
      }
    } catch (error) {
      console.error('Error parsing therapist recommendations:', error);
      // If parsing fails, just return the message without recommendations
    }
  }

  return { message, matchedTherapists };
}
