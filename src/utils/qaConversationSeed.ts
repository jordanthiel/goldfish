import type { ChatMessage } from '@/services/chatbotService';

/** Deterministic QA thread → completion + email modal (internal / Vite dev only). */
export const QA_CONVERSATION_SEED_MESSAGES: ChatMessage[] = [
  {
    role: 'user',
    content: '[QA] Conversation skipped — use the modal to test email capture.',
  },
  {
    role: 'assistant',
    content:
      "You've reached the scripted end—we'll grab your email in the next step.",
    marksConversationComplete: true,
  },
];
