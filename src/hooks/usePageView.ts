import { useEffect } from 'react';
import { trackEvent } from '@/services/analyticsService';

export function usePageView(pageSlug: string) {
  useEffect(() => {
    trackEvent('page_view', { pageSlug });
  }, [pageSlug]);
}
