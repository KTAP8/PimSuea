import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { appUrl } from '@/lib/site';

/** Sends the browser to the same path on app.pimsuea.com (marketing → app handoff). */
export function RedirectToApp() {
  const location = useLocation();

  useEffect(() => {
    const target = appUrl(`${location.pathname}${location.search}${location.hash}`);
    window.location.replace(target);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
