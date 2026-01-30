import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from './chatbotService';
import { ModelConfig } from '@/utils/modelConfig';

export interface DeviceInfo {
  ip_address?: string;
  user_agent?: string;
  location?: string;
  timezone?: string;
  language?: string;
  platform?: string;
}

export interface ConversationData {
  id?: string;
  user_id?: string | null;
  session_id: string;
  model_provider: string;
  model_id: string;
  conversation_data: ChatMessage[];
  device_info?: DeviceInfo;
  started_at?: string;
  ended_at?: string;
}

// Generate a unique session ID for anonymous users
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get or create session ID from localStorage
export const getSessionId = (): string => {
  try {
    let sessionId = localStorage.getItem('chatbot_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('chatbot_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error('Error getting session ID:', error);
    return generateSessionId();
  }
};

// Get device info from browser
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  const deviceInfo: DeviceInfo = {
    user_agent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // Try to get location (requires user permission)
  try {
    if (navigator.geolocation) {
      // Note: This requires user permission, so we'll just get timezone for now
      // Location can be added later if needed
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }

  return deviceInfo;
};

export const chatbotConversationService = {
  // Initialize or update a conversation in the database
  saveConversation: async (
    messages: ChatMessage[],
    modelConfig: ModelConfig,
    deviceInfo?: DeviceInfo,
    conversationId?: string | null
  ): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      if (conversationId) {
        // Update existing conversation
        const { data, error } = await supabase
          .from('chatbot_conversations')
          .update({
            conversation_data: messages,
            model_provider: modelConfig.provider,
            model_id: modelConfig.modelId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId)
          .select('id')
          .single();

        if (error) {
          console.error('Error updating conversation:', error);
          return null;
        }

        return data?.id || conversationId;
      } else {
        // Create new conversation
        const conversationData: ConversationData = {
          user_id: user?.id || null,
          session_id: sessionId,
          model_provider: modelConfig.provider,
          model_id: modelConfig.modelId,
          conversation_data: messages,
          device_info: deviceInfo,
        };

        const { data, error } = await supabase
          .from('chatbot_conversations')
          .insert(conversationData)
          .select('id')
          .single();

        if (error) {
          console.error('Error saving conversation:', error);
          return null;
        }

        return data?.id || null;
      }
    } catch (error) {
      console.error('Error in saveConversation:', error);
      return null;
    }
  },

  // Update conversation when it ends
  endConversation: async (conversationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        console.error('Error ending conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in endConversation:', error);
      return false;
    }
  },

  // Get conversations for a user (or session)
  getConversations: async (userId?: string, sessionId?: string): Promise<ConversationData[]> => {
    try {
      let query = supabase
        .from('chatbot_conversations')
        .select('*')
        .order('started_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return (data || []) as ConversationData[];
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  },

  // Export conversation to CSV
  exportToCSV: (conversation: ConversationData): string => {
    const headers = [
      'Timestamp',
      'Role',
      'Content',
      'Model Provider',
      'Model ID',
      'User ID',
      'Session ID',
      'Device Info',
    ];

    const rows: string[][] = [];

    // Add conversation metadata row
    rows.push([
      conversation.started_at || '',
      'METADATA',
      `Model: ${conversation.model_provider}/${conversation.model_id}`,
      conversation.model_provider,
      conversation.model_id,
      conversation.user_id || 'Anonymous',
      conversation.session_id,
      JSON.stringify(conversation.device_info || {}),
    ]);

    // Add each message as a row
    conversation.conversation_data.forEach((message) => {
      rows.push([
        new Date().toISOString(), // Could be improved with actual message timestamps
        message.role.toUpperCase(),
        message.content.replace(/"/g, '""'), // Escape quotes for CSV
        conversation.model_provider,
        conversation.model_id,
        conversation.user_id || 'Anonymous',
        conversation.session_id,
        '',
      ]);
    });

    // Convert to CSV format
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  // Download CSV file
  downloadCSV: (conversation: ConversationData, filename?: string): void => {
    const csv = chatbotConversationService.exportToCSV(conversation);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename || `chatbot-conversation-${conversation.session_id}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
