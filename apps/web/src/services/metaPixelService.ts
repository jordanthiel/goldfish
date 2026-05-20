/**
 * Meta Pixel custom events (fbq). Never throws.
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */
import type { EmailCaptureVariant } from '@/utils/abTest';

interface ChatFlowMetaOptions {
  conversationId?: string | null;
  pageSlug?: string;
  variant?: EmailCaptureVariant | null;
  messageIndex?: number;
  source?: 'composer' | 'url';
}

const compactParams = (params: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );

const chatFlowParams = (options: ChatFlowMetaOptions = {}) =>
  compactParams({
    content_category: 'chat_onboarding',
    conversation_id: options.conversationId,
    page_slug: options.pageSlug,
    ab_variant: options.variant,
    message_index: options.messageIndex,
    source: options.source,
  });

export function trackMetaCustom(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;
    if (params && Object.keys(params).length > 0) {
      window.fbq('trackCustom', eventName, params);
    } else {
      window.fbq('trackCustom', eventName);
    }
  } catch {
    // ignore
  }
}

export function trackMetaStandard(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;
    if (params && Object.keys(params).length > 0) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
  } catch {
    // ignore
  }
}

const chatCompletedFiredForConversation = new Set<string>();
const emailCaptureShownFiredForConversation = new Set<string>();

/** One conversion per conversation (avoids duplicate fires, e.g. React Strict Mode). */
export function trackMetaChatCompletedOnce(
  conversationId: string,
  options: Omit<ChatFlowMetaOptions, 'conversationId'> = {},
): void {
  if (!conversationId || chatCompletedFiredForConversation.has(conversationId)) return;
  chatCompletedFiredForConversation.add(conversationId);
  trackMetaCustom('chat_completed', chatFlowParams({ ...options, conversationId }));
}

export function trackMetaChatStarted(options: ChatFlowMetaOptions = {}): void {
  const params = chatFlowParams(options);
  trackMetaCustom('chat_started', params);
  trackMetaCustom('chat_onboarding_started', params);
}

export function trackMetaChatMessageSent(options: ChatFlowMetaOptions = {}): void {
  trackMetaCustom('chat_message_sent', chatFlowParams(options));
}

export function trackMetaEmailCaptureShownOnce(
  conversationId: string,
  options: Omit<ChatFlowMetaOptions, 'conversationId'> = {},
): void {
  if (!conversationId || emailCaptureShownFiredForConversation.has(conversationId)) return;
  emailCaptureShownFiredForConversation.add(conversationId);
  trackMetaCustom('email_capture_shown', chatFlowParams({ ...options, conversationId }));
}

export function trackMetaEmailCaptureStarted(options: ChatFlowMetaOptions = {}): void {
  trackMetaCustom('email_capture_started', chatFlowParams(options));
}

export function trackMetaEmailInputStarted(options: ChatFlowMetaOptions = {}): void {
  trackMetaCustom('email_input_started', chatFlowParams(options));
}

export function trackMetaEmailCaptureSubmitAttempted(options: ChatFlowMetaOptions = {}): void {
  trackMetaCustom('email_capture_submit_attempted', chatFlowParams(options));
}

export function trackMetaEmailCaptured(options: ChatFlowMetaOptions = {}): void {
  const params = chatFlowParams(options);
  trackMetaCustom('email_capture_submitted', params);
  trackMetaCustom('email_captured', params);
  trackMetaStandard('Lead', {
    ...params,
    content_name: 'chat_onboarding_email_capture',
  });
}
