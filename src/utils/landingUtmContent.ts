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
      'Most people spend hours googling therapy types and still end up picking based on a profile photo. Tell us what\'s going on — our specialist clinical team finds the right fit for you, for free.',
  },
  2: {
    headline: 'Find your click, finally.',
    subtext:
      'Opening up was hard enough, but something doesn\'t click with your therapist. There\'s a better way to find someone who gets you. Tell us what matters to you — our specialist clinical team will hand-pick your match, for free.',
  },
  3: {
    headline: 'No lists. No guessing. Just the right click.',
    subtext:
      'Most people don\'t know exactly what they should be looking for in therapy until someone asks the right questions. Our AI-assisted intake helps you understand and articulate what you need, and our specialist clinical team will hand-pick your match, for free.',
  },
};

export const HOW_IT_WORKS_UNIVERSAL = [
  {
    title: 'Tell us what\'s going on',
    body:
      'No forms, no checkboxes. A real conversation that helps you work out what matters to you.',
  },
  {
    title: 'Leave the research to us',
    body:
      'Our specialist clinical team hand-picks the right potentials for you from a network of trusted therapists — free of charge.',
  },
  {
    title: 'We make the intro',
    body:
      'No pressure, no commitment. We\'ll pass the info to you — you decide the next step, free of charge.',
  },
] as const;
