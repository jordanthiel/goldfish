export type EmailCaptureVariant = 'A' | 'B';

const STORAGE_KEY = 'goldfish_ab_variant';

/**
 * Assigns and persists a 50/50 A/B test variant per browser session.
 * Variant A = "Trust first, then capture"
 * Variant B = "Scarcity first, then capture"
 */
export function getEmailCaptureVariant(): EmailCaptureVariant {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'A' || stored === 'B') return stored;

    const variant: EmailCaptureVariant = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(STORAGE_KEY, variant);
    return variant;
  } catch {
    // Fallback if localStorage is unavailable (e.g. incognito Safari)
    return Math.random() < 0.5 ? 'A' : 'B';
  }
}
