import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Fires Meta Pixel PageView on client-side route changes.
 * The first view is already tracked from index.html.
 */
export function MetaPixelRouteListener() {
  const location = useLocation();
  const isFirstPaint = useRef(true);

  useEffect(() => {
    if (isFirstPaint.current) {
      isFirstPaint.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [location.pathname, location.search]);

  return null;
}
