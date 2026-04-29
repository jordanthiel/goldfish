/**
 * Meta Pixel custom events (fbq). Never throws.
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */
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

const chatCompletedFiredForConversation = new Set<string>();

/** One conversion per conversation (avoids duplicate fires, e.g. React Strict Mode). */
export function trackMetaChatCompletedOnce(conversationId: string): void {
  if (!conversationId || chatCompletedFiredForConversation.has(conversationId)) return;
  chatCompletedFiredForConversation.add(conversationId);
  trackMetaCustom('chat_completed');
}
