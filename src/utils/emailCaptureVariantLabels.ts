export type EmailCaptureVariantCode = 'A' | 'B';

export const EMAIL_CAPTURE_VARIANT_LABELS: Record<
  EmailCaptureVariantCode,
  { short: string; name: string; description: string }
> = {
  A: {
    short: 'A',
    name: 'Trust',
    description: 'Trust-first copy, then email capture',
  },
  B: {
    short: 'B',
    name: 'Scarcity',
    description: 'Waitlist / scarcity framing',
  },
};

export function formatVariantLabel(
  variant: string | null | undefined,
  style: 'short' | 'full' = 'full',
): string {
  if (variant !== 'A' && variant !== 'B') return '—';
  const meta = EMAIL_CAPTURE_VARIANT_LABELS[variant];
  return style === 'short' ? meta.short : `${meta.short} · ${meta.name}`;
}
