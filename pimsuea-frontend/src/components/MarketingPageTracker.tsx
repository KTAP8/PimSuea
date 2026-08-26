import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isMarketingHost } from '@/lib/site';
import { track } from '@/lib/analytics';

/** Captures $pageview / $pageleave on the marketing host only (studio stays manual). */
export function MarketingPageTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isMarketingHost()) return;

    track('$pageview', {
      $current_url: window.location.href,
      path: location.pathname,
      host: window.location.hostname,
    });

    return () => {
      track('$pageleave', {
        $current_url: window.location.href,
        path: location.pathname,
      });
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
}
