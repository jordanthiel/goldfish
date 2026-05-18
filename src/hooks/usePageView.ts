import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackEvent } from '@/services/analyticsService';
import { recordShareLinkVisit } from '@/services/shareLinkService';
import { getEmailCaptureVariant } from '@/utils/abTest';
import { captureTrackingIdFromSearchParams } from '@/utils/trackingId';

export function usePageView(pageSlug: string) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const trackingId = captureTrackingIdFromSearchParams(searchParams);
    if (trackingId) {
      recordShareLinkVisit(trackingId, pageSlug);
    }
    trackEvent('page_view', { pageSlug, variant: getEmailCaptureVariant() });
  }, [pageSlug, searchParams]);
}
