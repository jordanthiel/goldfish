import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/services/chatbotService';
import { chatbotPromptService, ChatbotPrompt } from '@/services/chatbotPromptService';
import { chatbotConversationService, getSessionId, getDeviceInfo, DeviceInfo } from '@/services/chatbotConversationService';
import { landingPageService, LandingPage } from '@/services/landingPageService';
import { internalCmsService, ConversationWithExtraction } from '@/services/internalCmsService';
import { AVAILABLE_MODELS, ModelConfig, DEFAULT_MODEL } from '@/utils/modelConfig';

const ALL_CHAT_MODELS = [
  ...AVAILABLE_MODELS.anthropic,
  ...AVAILABLE_MODELS.openai,
  ...AVAILABLE_MODELS.gemini,
];
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sparkles,
  LayoutDashboard,
  LogOut,
  Plus,
  X,
  Bot,
  User,
  Loader2,
  ArrowUp,
  LayoutGrid,
  Columns3,
  MessageSquare,
  BarChart3,
  FlaskConical,
  Download,
  History,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

// ─── Types ──────────────────────────────────────────────────────────

interface ChatInstance {
  id: string;
  name: string;
  pageSlug: string;
  model: ModelConfig;
  promptVersionId: string | null; // null = active prompt
  systemPrompt: string;
  messages: ChatMessage[];
  isLoading: boolean;
  input: string;
  conversationId: string | null; // DB record ID
}

// ─── Direct Edge Function Call ──────────────────────────────────────

async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  provider: string,
  modelId: string
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? `Bearer ${session.access_token}`
    : `Bearer ${supabaseAnonKey}`;

  const response = await fetch(`${supabaseUrl}/functions/v1/chatbot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      systemPrompt,
      provider,
      modelId,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }

  return data.message;
}

// ─── Chat Instance Panel ────────────────────────────────────────────

interface ChatInstancePanelProps {
  instance: ChatInstance;
  landingPages: LandingPage[];
  promptsCache: Record<string, ChatbotPrompt[]>;
  onUpdate: (id: string, updates: Partial<ChatInstance>) => void;
  onSend: (id: string) => void;
  onExport: (id: string) => void;
  onClose?: (id: string) => void;
  compact?: boolean;
}

const ChatInstancePanel: React.FC<ChatInstancePanelProps> = ({
  instance,
  landingPages,
  promptsCache,
  onUpdate,
  onSend,
  onExport,
  onClose,
  compact = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompts = promptsCache[instance.pageSlug] || [];
  const allModels = ALL_CHAT_MODELS;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [instance.messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(instance.id);
    }
  };

  return (
    <Card className="flex flex-col h-full bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl overflow-hidden">
      {/* Config Bar */}
      <div className="flex-shrink-0 p-3 border-b border-gray-100 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Landing Page Selector */}
          <Select
            value={instance.pageSlug}
            onValueChange={(slug) => onUpdate(instance.id, { pageSlug: slug, promptVersionId: null })}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs bg-white border-gray-200">
              <SelectValue placeholder="Landing page" />
            </SelectTrigger>
            <SelectContent>
              {landingPages.map((page) => (
                <SelectItem key={page.slug} value={page.slug} className="text-xs">
                  {page.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Model Selector */}
          <Select
            value={`${instance.model.provider}:${instance.model.modelId}`}
            onValueChange={(val) => {
              const [provider, modelId] = val.split(':');
              const model = allModels.find(m => m.provider === provider && m.modelId === modelId);
              if (model) onUpdate(instance.id, { model });
            }}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs bg-white border-gray-200">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1 py-0 shrink-0 ${
                    instance.model.provider === 'openai'
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : instance.model.provider === 'anthropic'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : 'bg-purple-50 text-purple-600 border-purple-200'
                  }`}
                >
                  {instance.model.provider === 'openai'
                    ? 'OAI'
                    : instance.model.provider === 'anthropic'
                      ? 'Ant'
                      : 'Gem'}
                </Badge>
                <span className="truncate text-xs">{instance.model.name}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[350px]">
              <div className="px-2 py-1.5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Anthropic</span>
              </div>
              {AVAILABLE_MODELS.anthropic.map((m) => (
                <SelectItem key={`${m.provider}:${m.modelId}`} value={`${m.provider}:${m.modelId}`} className="text-xs py-2">
                  <div>
                    <span className="font-medium">{m.name}</span>
                    {m.description && <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>}
                  </div>
                </SelectItem>
              ))}
              <SelectSeparator />
              <div className="px-2 py-1.5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">OpenAI</span>
              </div>
              {AVAILABLE_MODELS.openai.map((m) => (
                <SelectItem key={`${m.provider}:${m.modelId}`} value={`${m.provider}:${m.modelId}`} className="text-xs py-2">
                  <div>
                    <span className="font-medium">{m.name}</span>
                    {m.description && <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>}
                  </div>
                </SelectItem>
              ))}
              <SelectSeparator />
              <div className="px-2 py-1.5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Gemini</span>
              </div>
              {AVAILABLE_MODELS.gemini.map((m) => (
                <SelectItem key={`${m.provider}:${m.modelId}`} value={`${m.provider}:${m.modelId}`} className="text-xs py-2">
                  <div>
                    <span className="font-medium">{m.name}</span>
                    {m.description && <p className="text-[10px] text-gray-400 mt-0.5">{m.description}</p>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Prompt Version Selector */}
          <Select
            value={instance.promptVersionId || '__active__'}
            onValueChange={(val) => {
              if (val === '__active__') {
                onUpdate(instance.id, { promptVersionId: null });
              } else {
                onUpdate(instance.id, { promptVersionId: val });
              }
            }}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs bg-white border-gray-200">
              <SelectValue placeholder="Prompt version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__active__" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Active Version
                </div>
              </SelectItem>
              {prompts.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    {p.is_active && <div className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                    v{p.version}
                    {p.is_active && <span className="text-[10px] text-gray-400">(active)</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {/* Message count */}
          <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-400">
            {instance.messages.length} msgs
          </Badge>

          {/* Export button */}
          {instance.messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-therapy-purple"
              onClick={() => onExport(instance.id)}
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-red-500"
              onClick={() => onClose(instance.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className={`flex-1 min-h-0 ${compact ? 'max-h-[350px]' : ''}`}>
        <div className="p-3 space-y-3">
          {instance.messages.length === 0 && !instance.isLoading && (
            <div className="text-center py-8 text-gray-400">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Send a message to start chatting</p>
            </div>
          )}

          {instance.messages.map((message, index) => (
            <div key={index} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  message.role === 'user'
                    ? 'bg-therapy-purple text-white'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    className="text-xs markdown-content leading-relaxed"
                    components={{
                      p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-3 mb-1.5 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-3 mb-1.5 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="mb-0.5">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      a: ({ href, children }) => (
                        <a href={href} className="text-therapy-purple underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-3 w-3 text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {instance.isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="rounded-lg px-3 py-2 bg-gray-50">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-therapy-purple" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white/60">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={instance.input}
            onChange={(e) => onUpdate(instance.id, { input: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={instance.isLoading}
            className="min-h-[40px] max-h-[100px] resize-none border-gray-200 bg-white text-xs placeholder:text-gray-400 focus-visible:ring-therapy-purple/30 pr-10 rounded-lg"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
            }}
          />
          <Button
            onClick={() => onSend(instance.id)}
            disabled={instance.isLoading || !instance.input.trim()}
            size="icon"
            className="absolute bottom-1 right-1 h-7 w-7 rounded-md bg-therapy-purple hover:bg-therapy-purple/90 disabled:opacity-40"
          >
            {instance.isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ─── Main Component ─────────────────────────────────────────────────

let nextInstanceId = 1;

function createInstance(pageSlug: string = 'default'): ChatInstance {
  const id = `chat-${nextInstanceId++}`;
  return {
    id,
    name: `Chat ${nextInstanceId - 1}`,
    pageSlug,
    model: { ...DEFAULT_MODEL },
    promptVersionId: null,
    systemPrompt: '',
    messages: [],
    isLoading: false,
    input: '',
    conversationId: null,
  };
}

const ChatPlayground: React.FC = () => {
  const { user, isInternal, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'tabs' | 'grid'>('tabs');
  const [instances, setInstances] = useState<ChatInstance[]>(() => [createInstance()]);
  const [activeTab, setActiveTab] = useState<string>(instances[0].id);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [promptsCache, setPromptsCache] = useState<Record<string, ChatbotPrompt[]>>({});
  const [loadingPages, setLoadingPages] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [recentConversations, setRecentConversations] = useState<ConversationWithExtraction[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');

  // Load device info once on mount
  useEffect(() => {
    getDeviceInfo().then(setDeviceInfo);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isInternal) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You do not have access to the internal dashboard.',
        variant: 'destructive',
      });
    }
  }, [authLoading, isInternal, navigate, toast]);

  // Load landing pages on mount
  useEffect(() => {
    if (isInternal) {
      loadLandingPages();
    }
  }, [isInternal]);

  // Load prompts whenever an instance's page slug changes
  useEffect(() => {
    const slugs = [...new Set(instances.map(i => i.pageSlug))];
    slugs.forEach(slug => {
      if (!promptsCache[slug]) {
        loadPrompts(slug);
      }
    });
  }, [instances.map(i => i.pageSlug).join(',')]);

  // Resolve system prompts when prompt selection changes
  useEffect(() => {
    instances.forEach(inst => {
      const prompts = promptsCache[inst.pageSlug] || [];
      let resolvedPrompt = '';

      if (inst.promptVersionId) {
        const found = prompts.find(p => p.id === inst.promptVersionId);
        resolvedPrompt = found?.system_prompt || '';
      } else {
        // Use active prompt
        const active = prompts.find(p => p.is_active);
        resolvedPrompt = active?.system_prompt || '';
      }

      if (resolvedPrompt && resolvedPrompt !== inst.systemPrompt) {
        updateInstance(inst.id, { systemPrompt: resolvedPrompt });
      }
    });
  }, [promptsCache, instances.map(i => `${i.pageSlug}:${i.promptVersionId}`).join(',')]);

  const loadLandingPages = async () => {
    setLoadingPages(true);
    try {
      const pages = await landingPageService.getAll();
      setLandingPages(pages);
    } catch (error) {
      console.error('Error loading landing pages:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const loadPrompts = async (pageSlug: string) => {
    try {
      const prompts = await chatbotPromptService.getAllPrompts(pageSlug);
      setPromptsCache(prev => ({ ...prev, [pageSlug]: prompts }));
    } catch (error) {
      console.error('Error loading prompts for', pageSlug, error);
    }
  };

  const updateInstance = useCallback((id: string, updates: Partial<ChatInstance>) => {
    setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst));
  }, []);

  const addInstance = () => {
    const newInst = createInstance(landingPages[0]?.slug || 'default');
    setInstances(prev => [...prev, newInst]);
    setActiveTab(newInst.id);
  };

  const removeInstance = (id: string) => {
    setInstances(prev => {
      const filtered = prev.filter(i => i.id !== id);
      if (filtered.length === 0) {
        const newInst = createInstance(landingPages[0]?.slug || 'default');
        setActiveTab(newInst.id);
        return [newInst];
      }
      if (activeTab === id) {
        setActiveTab(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleSend = async (instanceId: string) => {
    const inst = instances.find(i => i.id === instanceId);
    if (!inst || !inst.input.trim() || inst.isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: inst.input.trim() };
    const updatedMessages = [...inst.messages, userMessage];

    updateInstance(instanceId, {
      messages: updatedMessages,
      input: '',
      isLoading: true,
    });

    try {
      // Resolve system prompt if not already set
      let systemPrompt = inst.systemPrompt;
      if (!systemPrompt) {
        const activePrompt = await chatbotPromptService.getActivePrompt(inst.pageSlug);
        systemPrompt = activePrompt;
        updateInstance(instanceId, { systemPrompt: activePrompt });
      }

      const responseText = await sendChatMessage(
        updatedMessages,
        systemPrompt,
        inst.model.provider,
        inst.model.modelId
      );

      const assistantMessage: ChatMessage = { role: 'assistant', content: responseText };
      const finalMessages = [...updatedMessages, assistantMessage];

      // Save conversation to the database
      try {
        const savedId = await chatbotConversationService.saveConversation(
          finalMessages,
          inst.model,
          deviceInfo || undefined,
          inst.conversationId
        );

        updateInstance(instanceId, {
          messages: finalMessages,
          isLoading: false,
          conversationId: savedId || inst.conversationId,
        });
      } catch (saveError) {
        console.error('Error saving conversation:', saveError);
        // Still update messages even if save fails
        updateInstance(instanceId, {
          messages: finalMessages,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorText = error instanceof Error ? error.message : 'An unexpected error occurred';
      const errorMessages = [
        ...updatedMessages,
        { role: 'assistant' as const, content: `Error: ${errorText}` },
      ];

      // Still save the conversation with the error message so it appears in CMS
      try {
        const savedId = await chatbotConversationService.saveConversation(
          errorMessages,
          inst.model,
          deviceInfo || undefined,
          inst.conversationId
        );
        updateInstance(instanceId, {
          messages: errorMessages,
          isLoading: false,
          conversationId: savedId || inst.conversationId,
        });
      } catch {
        updateInstance(instanceId, {
          messages: errorMessages,
          isLoading: false,
        });
      }
    }
  };

  const handleExport = (instanceId: string) => {
    const inst = instances.find(i => i.id === instanceId);
    if (!inst || inst.messages.length === 0) return;

    const conversationData = {
      id: inst.conversationId || undefined,
      session_id: getSessionId(),
      model_provider: inst.model.provider,
      model_id: inst.model.modelId,
      conversation_data: inst.messages,
      device_info: deviceInfo || undefined,
      started_at: new Date().toISOString(),
    };

    chatbotConversationService.downloadCSV(conversationData);
  };

  const openLoadDialog = async () => {
    setShowLoadDialog(true);
    setConversationSearch('');
    await loadRecentConversations();
  };

  const loadRecentConversations = async () => {
    setLoadingConversations(true);
    try {
      const result = await internalCmsService.getConversations({ limit: 50 });
      setRecentConversations(result.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleLoadConversation = (conv: ConversationWithExtraction) => {
    const matchedModel = ALL_CHAT_MODELS.find(
      m => m.provider === conv.model_provider && m.modelId === conv.model_id
    ) || DEFAULT_MODEL;

    const newInst = createInstance(landingPages[0]?.slug || 'default');
    newInst.name = `Loaded ${conv.session_id.slice(0, 8)}`;
    newInst.model = matchedModel;
    newInst.messages = (conv.conversation_data || []).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
    newInst.conversationId = conv.id;

    setInstances(prev => [...prev, newInst]);
    setActiveTab(newInst.id);
    setShowLoadDialog(false);

    toast({
      title: 'Conversation Loaded',
      description: `Loaded ${newInst.messages.length} messages. You can continue the conversation.`,
    });
  };

  const filteredConversations = recentConversations.filter(conv => {
    if (!conversationSearch.trim()) return true;
    const q = conversationSearch.toLowerCase();
    const sessionMatch = conv.session_id.toLowerCase().includes(q);
    const modelMatch = conv.model_id.toLowerCase().includes(q);
    const contentMatch = conv.conversation_data?.some(
      m => m.content.toLowerCase().includes(q)
    );
    const nameMatch = conv.extraction?.extracted_name?.toLowerCase().includes(q);
    const profileMatch = conv.profile?.full_name?.toLowerCase().includes(q) ||
      conv.profile?.email?.toLowerCase().includes(q);
    return sessionMatch || modelMatch || contentMatch || nameMatch || profileMatch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreviewText = (conv: ConversationWithExtraction) => {
    const firstUserMsg = conv.conversation_data?.find(m => m.role === 'user');
    if (!firstUserMsg) return 'No messages';
    return firstUserMsg.content.length > 100
      ? firstUserMsg.content.slice(0, 100) + '...'
      : firstUserMsg.content;
  };

  // ─── Render ─────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-therapy-purple" />
      </div>
    );
  }

  if (!isInternal) return null;

  const activeInstance = instances.find(i => i.id === activeTab) || instances[0];

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 w-full py-3 px-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-[1600px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-therapy-purple to-therapy-pink flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-800">Goldfish</span>
              </Link>
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-therapy-purple" />
                <span className="text-sm font-medium text-gray-600">Chat Playground</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/internal">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/internal/aggregate">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Aggregate
                </Button>
              </Link>

              <div className="h-5 w-px bg-gray-200 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-therapy-purple text-white text-sm">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Internal User</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { signOut(); navigate('/'); }} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex-shrink-0 px-4 py-2 bg-white/50 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 rounded-md text-xs ${
                  viewMode === 'tabs'
                    ? 'bg-white shadow-sm text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setViewMode('tabs')}
              >
                <Columns3 className="h-3.5 w-3.5 mr-1" />
                Tabs
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 rounded-md text-xs ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                Grid
              </Button>
            </div>

            <div className="h-5 w-px bg-gray-200" />

            {/* Tab Strip (in tab mode) */}
            {viewMode === 'tabs' && (
              <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
                {instances.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => setActiveTab(inst.id)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeTab === inst.id
                        ? 'bg-therapy-purple text-white shadow-sm'
                        : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800 border border-gray-200'
                    }`}
                  >
                    <MessageSquare className="h-3 w-3" />
                    {inst.name}
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 ${
                        activeTab === inst.id
                          ? 'border-white/30 text-white/80'
                          : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      {inst.pageSlug}
                    </Badge>
                    {instances.length > 1 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); removeInstance(inst.id); }}
                        className={`ml-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                          activeTab === inst.id
                            ? 'hover:bg-white/20'
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {viewMode === 'grid' && <div className="flex-1" />}

            {/* Add Instance / Load Buttons */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-dashed border-gray-300 text-gray-500 hover:text-therapy-purple hover:border-therapy-purple/30"
              onClick={addInstance}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-gray-300 text-gray-500 hover:text-therapy-purple hover:border-therapy-purple/30"
              onClick={openLoadDialog}
            >
              <History className="h-3.5 w-3.5 mr-1" />
              Load Chat
            </Button>

            <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200">
              {instances.length} instance{instances.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 p-4">
          <div className="max-w-[1600px] mx-auto h-full">
            {viewMode === 'tabs' ? (
              /* Tab View - single active instance */
              <div className="h-full max-w-4xl mx-auto">
                {activeInstance && (
                  <ChatInstancePanel
                    instance={activeInstance}
                    landingPages={landingPages}
                    promptsCache={promptsCache}
                    onUpdate={updateInstance}
                    onSend={handleSend}
                    onExport={handleExport}
                    onClose={instances.length > 1 ? removeInstance : undefined}
                  />
                )}
              </div>
            ) : (
              /* Grid View - all instances visible */
              <div
                className={`h-full grid gap-4 auto-rows-fr ${
                  instances.length === 1
                    ? 'grid-cols-1 max-w-4xl mx-auto'
                    : instances.length === 2
                    ? 'grid-cols-2'
                    : instances.length <= 4
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
                }`}
              >
                {instances.map((inst) => (
                  <ChatInstancePanel
                    key={inst.id}
                    instance={inst}
                    landingPages={landingPages}
                    promptsCache={promptsCache}
                    onUpdate={updateInstance}
                    onSend={handleSend}
                    onExport={handleExport}
                    onClose={instances.length > 1 ? removeInstance : undefined}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Load Previous Chat Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-therapy-purple" />
              Load Previous Conversation
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by session, model, name, or message content..."
              className="pl-10 bg-white border-gray-200"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
            />
          </div>

          {/* Conversation List */}
          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-therapy-purple" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {conversationSearch ? 'No conversations match your search' : 'No conversations found'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleLoadConversation(conv)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white hover:border-therapy-purple/30 hover:bg-purple-50/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500">
                            {conv.session_id.slice(0, 16)}
                          </span>
                          <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-500">
                            {conv.model_id}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] border-gray-200 text-gray-400">
                            {conv.conversation_data?.length || 0} msgs
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {getPreviewText(conv)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-400">
                            {formatDate(conv.started_at)}
                          </span>
                          {conv.profile && (
                            <span className="text-[10px] text-therapy-purple font-medium">
                              {conv.profile.full_name || conv.profile.email}
                            </span>
                          )}
                          {!conv.profile && conv.extraction?.extracted_name && (
                            <span className="text-[10px] text-gray-500">
                              {conv.extraction.extracted_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge className="bg-therapy-purple text-white text-[10px]">
                          Load
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPlayground;
