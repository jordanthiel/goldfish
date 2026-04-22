import { supabase } from '@/integrations/supabase/client';

export interface ConversationExtraction {
  id: string;
  conversation_id: string;
  extracted_name: string | null;
  extracted_age: number | null;
  extracted_gender: string | null;
  extracted_email: string | null;
  case_summary: string;
  recommendation: string;
  chat_history: Array<{ role: string; content: string }>;
  model_used: string;
  extraction_prompt?: string;
  raw_extraction: any;
  extracted_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ConversationWithExtraction {
  id: string;
  user_id: string | null;
  session_id: string;
  model_provider: string;
  model_id: string;
  conversation_data: Array<{ role: string; content: string }>;
  device_info: any;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  extraction?: ConversationExtraction;
  profile?: UserProfile;
}

export interface AnalysisThread {
  id: string;
  user_id: string;
  thread_type: 'aggregate' | 'specific';
  conversation_id: string | null;
  title: string | null;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

export interface AggregateStats {
  totalConversations: number;
  extractedConversations: number;
  genderBreakdown: Record<string, number>;
  ageBreakdown: { min: number; max: number; avg: number } | null;
  recentConversations: number;
}

export interface FunnelStepCount {
  event_name: string;
  count: number;
}

export interface FunnelVariantBreakdown {
  event_name: string;
  ab_variant: string | null;
  count: number;
}

export interface DailyEventCount {
  date: string;
  event_name: string;
  count: number;
}

export interface FunnelAnalyticsData {
  funnelCounts: FunnelStepCount[];
  variantBreakdown: FunnelVariantBreakdown[];
  dailyTrend: DailyEventCount[];
  waitlistSubmissions: number;
  totalEvents: number;
}

export const internalCmsService = {
  // Check if current user is internal
  async isInternalUser(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('is_internal')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking internal status:', error);
        return false;
      }

      return data?.is_internal === true;
    } catch (error) {
      console.error('Error in isInternalUser:', error);
      return false;
    }
  },

  // Get all conversations with optional extractions and profiles
  async getConversations(options?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
  }): Promise<{ data: ConversationWithExtraction[]; count: number }> {
    try {
      let query = supabase
        .from('chatbot_conversations')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: conversations, error, count } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return { data: [], count: 0 };
      }

      // Fetch extractions for these conversations
      const conversationIds = (conversations || []).map(c => c.id);
      const { data: extractions } = await supabase
        .from('conversation_extractions')
        .select('*')
        .in('conversation_id', conversationIds);

      // Fetch profiles for conversations with user_ids
      const userIds = (conversations || [])
        .filter(c => c.user_id)
        .map(c => c.user_id);
      
      let profileMap = new Map<string, UserProfile>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, first_name, last_name, avatar_url, created_at')
          .in('id', userIds);
        
        profileMap = new Map(
          (profiles || []).map(p => [p.id, p as UserProfile])
        );
      }

      // Map extractions and profiles to conversations
      const extractionMap = new Map(
        (extractions || []).map(e => [e.conversation_id, e])
      );

      const result = (conversations || []).map(conv => ({
        ...conv,
        extraction: extractionMap.get(conv.id) || undefined,
        profile: conv.user_id ? profileMap.get(conv.user_id) : undefined,
      })) as ConversationWithExtraction[];

      return { data: result, count: count || 0 };
    } catch (error) {
      console.error('Error in getConversations:', error);
      return { data: [], count: 0 };
    }
  },

  // Get a single conversation with extraction and profile
  async getConversation(id: string): Promise<ConversationWithExtraction | null> {
    try {
      const { data: conversation, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !conversation) {
        console.error('Error fetching conversation:', error);
        return null;
      }

      const { data: extraction } = await supabase
        .from('conversation_extractions')
        .select('*')
        .eq('conversation_id', id)
        .single();

      // Fetch profile if user_id exists
      let profile: UserProfile | undefined;
      if (conversation.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email, full_name, first_name, last_name, avatar_url, created_at')
          .eq('id', conversation.user_id)
          .single();
        profile = profileData as UserProfile | undefined;
      }

      return {
        ...conversation,
        extraction: extraction || undefined,
        profile,
      } as ConversationWithExtraction;
    } catch (error) {
      console.error('Error in getConversation:', error);
      return null;
    }
  },

  // Extract data from a conversation using Gemini
  async extractConversation(
    conversationId: string,
    forceReExtract: boolean = false
  ): Promise<{ extraction: ConversationExtraction | null; cached: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { extraction: null, cached: false, error: 'Not authenticated' };
      }

      const response = await supabase.functions.invoke('extract-conversation', {
        body: {
          action: 'extract',
          conversationId,
          forceReExtract,
        },
      });

      if (response.error) {
        return { extraction: null, cached: false, error: response.error.message };
      }

      return {
        extraction: response.data.extraction,
        cached: response.data.cached,
      };
    } catch (error: any) {
      console.error('Error extracting conversation:', error);
      return { extraction: null, cached: false, error: error.message };
    }
  },

  // Chat with Gemini about conversation data
  async chatWithGemini(
    messages: Array<{ role: string; content: string }>,
    threadType: 'aggregate' | 'specific',
    conversationId?: string
  ): Promise<{ message: string; error?: string }> {
    try {
      const response = await supabase.functions.invoke('extract-conversation', {
        body: {
          action: 'chat',
          messages,
          threadType,
          conversationId,
        },
      });

      if (response.error) {
        return { message: '', error: response.error.message };
      }

      return { message: response.data.message };
    } catch (error: any) {
      console.error('Error chatting with Gemini:', error);
      return { message: '', error: error.message };
    }
  },

  // Get aggregate statistics
  async getAggregateStats(): Promise<AggregateStats> {
    try {
      // Get total conversations
      const { count: totalConversations } = await supabase
        .from('chatbot_conversations')
        .select('*', { count: 'exact', head: true });

      // Get extracted conversations count
      const { count: extractedConversations } = await supabase
        .from('conversation_extractions')
        .select('*', { count: 'exact', head: true });

      // Get all extractions for analysis
      const { data: extractions } = await supabase
        .from('conversation_extractions')
        .select('extracted_gender, extracted_age');

      // Calculate gender breakdown
      const genderBreakdown: Record<string, number> = {};
      const ages: number[] = [];

      for (const ext of extractions || []) {
        if (ext.extracted_gender) {
          const gender = ext.extracted_gender.toLowerCase();
          genderBreakdown[gender] = (genderBreakdown[gender] || 0) + 1;
        }
        if (ext.extracted_age) {
          ages.push(ext.extracted_age);
        }
      }

      // Calculate age breakdown
      let ageBreakdown = null;
      if (ages.length > 0) {
        ageBreakdown = {
          min: Math.min(...ages),
          max: Math.max(...ages),
          avg: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
        };
      }

      // Get recent conversations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentConversations } = await supabase
        .from('chatbot_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', sevenDaysAgo.toISOString());

      return {
        totalConversations: totalConversations || 0,
        extractedConversations: extractedConversations || 0,
        genderBreakdown,
        ageBreakdown,
        recentConversations: recentConversations || 0,
      };
    } catch (error) {
      console.error('Error getting aggregate stats:', error);
      return {
        totalConversations: 0,
        extractedConversations: 0,
        genderBreakdown: {},
        ageBreakdown: null,
        recentConversations: 0,
      };
    }
  },

  // Analysis threads CRUD
  async getAnalysisThreads(): Promise<AnalysisThread[]> {
    try {
      const { data, error } = await supabase
        .from('internal_analysis_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching analysis threads:', error);
        return [];
      }

      return data as AnalysisThread[];
    } catch (error) {
      console.error('Error in getAnalysisThreads:', error);
      return [];
    }
  },

  async createAnalysisThread(
    threadType: 'aggregate' | 'specific',
    conversationId?: string,
    title?: string
  ): Promise<AnalysisThread | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('internal_analysis_threads')
        .insert({
          user_id: user.id,
          thread_type: threadType,
          conversation_id: conversationId || null,
          title: title || (threadType === 'aggregate' ? 'Aggregate Analysis' : 'Conversation Analysis'),
          messages: [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating analysis thread:', error);
        return null;
      }

      return data as AnalysisThread;
    } catch (error) {
      console.error('Error in createAnalysisThread:', error);
      return null;
    }
  },

  async updateAnalysisThread(
    threadId: string,
    messages: Array<{ role: string; content: string; timestamp: string }>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('internal_analysis_threads')
        .update({ messages })
        .eq('id', threadId);

      if (error) {
        console.error('Error updating analysis thread:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateAnalysisThread:', error);
      return false;
    }
  },

  async deleteAnalysisThread(threadId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('internal_analysis_threads')
        .delete()
        .eq('id', threadId);

      if (error) {
        console.error('Error deleting analysis thread:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAnalysisThread:', error);
      return false;
    }
  },

  // Bulk extract conversations
  async bulkExtractConversations(
    conversationIds: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < conversationIds.length; i++) {
      const result = await this.extractConversation(conversationIds[i], false);
      if (result.extraction) {
        success++;
      } else {
        failed++;
      }
      onProgress?.(i + 1, conversationIds.length);
    }

    return { success, failed };
  },

  async getFunnelAnalytics(days: number = 30): Promise<FunnelAnalyticsData> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceISO = since.toISOString();

      // Unique sessions per event (de-duped funnel counts)
      const { data: events } = await supabase
        .from('funnel_events')
        .select('event_name, session_id, ab_variant, created_at')
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: true });

      const rows = events || [];

      // --- Funnel counts (unique sessions per step) ---
      const sessionsByEvent = new Map<string, Set<string>>();
      for (const r of rows) {
        if (!sessionsByEvent.has(r.event_name)) sessionsByEvent.set(r.event_name, new Set());
        sessionsByEvent.get(r.event_name)!.add(r.session_id);
      }
      const funnelCounts: FunnelStepCount[] = [
        'page_view', 'chat_started', 'message_sent',
        'conversation_complete', 'email_capture_shown', 'email_capture_submitted',
      ].map(name => ({
        event_name: name,
        count: sessionsByEvent.get(name)?.size ?? 0,
      }));

      // --- Variant breakdown (unique sessions per event × variant) ---
      const variantKey = (e: string, v: string | null) => `${e}|${v ?? 'none'}`;
      const variantSessions = new Map<string, Set<string>>();
      for (const r of rows) {
        const k = variantKey(r.event_name, r.ab_variant);
        if (!variantSessions.has(k)) variantSessions.set(k, new Set());
        variantSessions.get(k)!.add(r.session_id);
      }
      const variantBreakdown: FunnelVariantBreakdown[] = [];
      for (const [k, sessions] of variantSessions) {
        const [event_name, ab_variant] = k.split('|');
        variantBreakdown.push({
          event_name,
          ab_variant: ab_variant === 'none' ? null : ab_variant,
          count: sessions.size,
        });
      }

      // --- Daily trend (raw event counts per day) ---
      const dailyMap = new Map<string, number>();
      for (const r of rows) {
        const day = r.created_at.slice(0, 10);
        const k = `${day}|${r.event_name}`;
        dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1);
      }
      const dailyTrend: DailyEventCount[] = [];
      for (const [k, count] of dailyMap) {
        const [date, event_name] = k.split('|');
        dailyTrend.push({ date, event_name, count });
      }
      dailyTrend.sort((a, b) => a.date.localeCompare(b.date));

      // --- Waitlist submissions ---
      const { count: waitlistSubmissions } = await supabase
        .from('waitlist_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sinceISO);

      return {
        funnelCounts,
        variantBreakdown,
        dailyTrend,
        waitlistSubmissions: waitlistSubmissions ?? 0,
        totalEvents: rows.length,
      };
    } catch (error) {
      console.error('Error getting funnel analytics:', error);
      return {
        funnelCounts: [],
        variantBreakdown: [],
        dailyTrend: [],
        waitlistSubmissions: 0,
        totalEvents: 0,
      };
    }
  },
};
