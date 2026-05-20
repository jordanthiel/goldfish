/**
 * Maps utm_content (paid social) to hero copy variants.
 * Direct traffic → version 1.
 */
export type LandingHeroVersion = 1 | 2 | 3;

/** utm_content values from campaign URLs (hyphen prefixes vary by macro). */
const RETURNER_VALUES = new Set(['returner']);
const AI_VALUES = new Set(['ai']);

function normalizeUtmContent(raw: string): string[] {
  const t = raw.trim().toLowerCase();
  if (!t) return [];
  const noLeadingHyphen = t.startsWith('-') ? t.slice(1) : t;
  return [t, noLeadingHyphen];
}

/** Resolves Hero version from utm_content. Missing/unknown → first-timer defaults. */
export function getLandingHeroVersion(utmContent: string | null): LandingHeroVersion {
  if (utmContent == null || utmContent === '') return 1;

  const variants = normalizeUtmContent(utmContent);
  for (const v of variants) {
    if (RETURNER_VALUES.has(v)) return 2;
  }
  for (const v of variants) {
    if (AI_VALUES.has(v)) return 3;
  }
  /** firsttimer, -firsttimer, unknown → version 1 */
  return 1;
}

export const LANDING_HERO_COPY: Record<
  LandingHeroVersion,
  { headline: string; subtext: string }
> = {
  1: {
    headline: 'No lists. No guessing. Just the right click.',
    subtext:
      'Skip the bios and guesswork — tell us what\'s going on in chat. Our clinical team hand-picks therapists who fit. Free.',
  },
  2: {
    headline: 'Find your click, finally.',
    subtext:
      'Hard to click with someone new? Say what matters to you — we hand-pick stronger matches from our trusted network. Free.',
  },
  3: {
    headline: 'No lists. No guessing. Just the right click.',
    subtext:
      'We ask the questions that sharpen what you need. AI-assisted intake, then our team picks your match. Free.',
  },
};

export const HOW_IT_WORKS_UNIVERSAL = [
  {
    title: 'Tell us what\'s going on',
    body: 'Short chat — no forms. Figure out what actually matters.',
  },
  {
    title: 'We narrow the field',
    body: 'Our team vets options from trusted therapists — you skip the doom-scroll.',
  },
  {
    title: 'You get the intro',
    body: 'We send possibilities; you decide if and when to reach out. No obligation.',
  },
] as const;
