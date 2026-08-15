import { initAnalytics } from '@/lib/analytics';

/** Initializes PostHog once at app boot. Renders nothing. */
export function AnalyticsProvider() {
    // Sync init during render so studio mount effects can capture on first paint.
    initAnalytics();
    return null;
}
