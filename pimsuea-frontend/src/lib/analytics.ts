import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined)
    ?? 'https://eu.i.posthog.com';

let initialized = false;

function shouldCapture(): boolean {
    if (!POSTHOG_KEY) return false;
    if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG !== 'true') return false;
    return true;
}

/** Call once at app boot (see AnalyticsProvider). */
export function initAnalytics(): void {
    if (initialized || !shouldCapture()) return;
    initialized = true;

    posthog.init(POSTHOG_KEY!, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        autocapture: false,
        persistence: 'localStorage',
        session_recording: {
            maskAllInputs: true,
        },
    });
}

export function identifyUser(userId: string): void {
    if (!shouldCapture() || !initialized) return;
    posthog.identify(userId);
}

export function resetAnalytics(): void {
    if (!initialized) return;
    posthog.reset();
}

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, props?: AnalyticsProps): void {
    if (!shouldCapture() || !initialized) {
        if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG === 'true') {
            console.debug('[analytics]', event, props);
        }
        return;
    }
    posthog.capture(event, props);
}

export function getViewport(): 'mobile' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    return window.matchMedia('(min-width: 768px)').matches ? 'desktop' : 'mobile';
}
