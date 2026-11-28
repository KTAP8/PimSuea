import { initAnalytics } from '@/lib/analytics';
import { captureAttribution } from '@/lib/attribution';

/** Initializes PostHog and Meta Pixel once at app boot. Renders nothing. */
export function AnalyticsProvider() {
    // Sync init during render so studio mount effects can capture on first paint.
    captureAttribution();
    initAnalytics();
    return null;
}
