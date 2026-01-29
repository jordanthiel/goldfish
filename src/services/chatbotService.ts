import { chatbotPromptService } from './chatbotPromptService';
import { Therapist } from '@/types/therapist';
import { therapistDiscoveryService } from './therapistDiscoveryService';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  matchedTherapists?: Therapist[];
}

export interface ChatbotResponse {
  message: string;
  matchedTherapists?: Therapist[];
  isComplete?: boolean;
}

export const chatbotService = {
  // Send a message to the chatbot and get a response
  sendMessage: async (
    messages: ChatMessage[],
    therapists: Therapist[]
  ): Promise<ChatbotResponse> => {
    try {
      // Get the active system prompt
      const systemPrompt = await chatbotPromptService.getActivePrompt();

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

      // Call Supabase Edge Function for chatbot
      // Use supabase.functions.invoke which handles auth headers automatically
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          messages: apiMessages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: enhancedSystemPrompt,
        },
      });

      if (error) {
        console.error('Chatbot function error:', error);
        throw new Error(error.message || 'Failed to get chatbot response');
      }
      
      if (!data || !data.message) {
        throw new Error('Invalid response from chatbot');
      }

      // Extract therapist recommendations from structured response
      const { message, matchedTherapists } = parseChatbotResponse(data.message, therapists);

      return {
        message,
        matchedTherapists: matchedTherapists.length > 0 ? matchedTherapists : undefined,
        isComplete: matchedTherapists.length > 0,
      };
    } catch (error) {
      console.error('Error in chatbot service:', error);
      
      // Fallback response
      return {
        message: "I'm here to help you find the right therapist. Can you tell me a bit about what you're looking for?",
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
