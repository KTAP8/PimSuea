import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';

/** Initializes PostHog once at app boot. Renders nothing. */
export function AnalyticsProvider() {
    useEffect(() => {
        initAnalytics();
    }, []);
    return null;
}
