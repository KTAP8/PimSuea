import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackMeta } from '@/lib/analytics';

/** SPA PageView for Meta Pixel (init does not fire PageView on its own). */
export function MetaPageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackMeta('PageView');
  }, [location.pathname, location.search]);

  return null;
}
