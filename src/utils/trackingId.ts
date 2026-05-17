const STORAGE_KEY = 'share_tracking_id';
const VISIT_FLAG_PREFIX = 'share_visit_recorded_';
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function isValidTrackingId(id: string | null | undefined): id is string {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

export function normalizeTrackingId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  return isValidTrackingId(trimmed) ? trimmed : null;
}

export function getStoredTrackingId(): string | null {
  try {
    return normalizeTrackingId(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setStoredTrackingId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore quota / private mode
  }
}

/** Read ?id= from URL, persist for the session, return normalized id if valid. */
export function captureTrackingIdFromSearchParams(
  params: URLSearchParams,
): string | null {
  const fromUrl = normalizeTrackingId(params.get('id'));
  if (fromUrl) {
    setStoredTrackingId(fromUrl);
    return fromUrl;
  }
  return getStoredTrackingId();
}

export function hasRecordedVisitForSession(trackingId: string): boolean {
  try {
    return sessionStorage.getItem(`${VISIT_FLAG_PREFIX}${trackingId}`) === '1';
  } catch {
    return false;
  }
}

export function markVisitRecordedForSession(trackingId: string): void {
  try {
    sessionStorage.setItem(`${VISIT_FLAG_PREFIX}${trackingId}`, '1');
  } catch {
    // ignore
  }
}

export function generateTrackingId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return `link${Date.now().toString(36)}`;
}

export function buildShareUrl(trackingId: string, path = '/'): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const url = new URL(path, base || 'https://goldfish.app');
  url.searchParams.set('id', trackingId);
  return url.toString();
}
