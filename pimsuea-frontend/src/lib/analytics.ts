import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined)
    ?? 'https://eu.i.posthog.com';

/** Events Manager pixel. Loads only when VITE_PUBLIC_META_PIXEL_ID is set. */
const META_PIXEL_ID =
    (import.meta.env.VITE_PUBLIC_META_PIXEL_ID as string | undefined)?.trim() || '';

type Fbq = {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    loaded?: boolean;
    version?: string;
    push: Fbq;
};

declare global {
    interface Window {
        fbq?: Fbq;
        _fbq?: Fbq;
    }
}

let initialized = false;
let metaInitialized = false;

function analyticsDebugEnabled(): boolean {
    return import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG === 'true';
}

function shouldCapture(): boolean {
    if (!POSTHOG_KEY) return false;
    if (import.meta.env.DEV && !analyticsDebugEnabled()) return false;
    return true;
}

function shouldLoadMeta(): boolean {
    if (!META_PIXEL_ID) return false;
    if (import.meta.env.DEV && !analyticsDebugEnabled()) return false;
    return true;
}

function initMetaPixel(): void {
    if (metaInitialized || !shouldLoadMeta() || typeof window === 'undefined') return;
    metaInitialized = true;

    const w = window;
    if (!w.fbq) {
        const n = function (...args: unknown[]) {
            if (n.callMethod) n.callMethod(...args);
            else n.queue.push(args);
        } as Fbq;
        n.queue = [];
        n.loaded = true;
        n.version = '2.0';
        n.push = n;
        w.fbq = n;
        if (!w._fbq) w._fbq = n;

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        const first = document.getElementsByTagName('script')[0];
        first?.parentNode?.insertBefore(script, first);
    }

    w.fbq?.('init', META_PIXEL_ID);
}

/** Call once at app boot (see AnalyticsProvider). */
export function initAnalytics(): void {
    initMetaPixel();

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
        if (analyticsDebugEnabled()) {
            console.debug('[analytics]', event, props);
        }
        return;
    }
    posthog.capture(event, props);
}

export type MetaEventParams = Record<string, string | number | boolean | null | undefined>;

export function trackMeta(
    event: string,
    params?: MetaEventParams,
    options?: { eventID?: string },
): void {
    if (!shouldLoadMeta()) {
        if (analyticsDebugEnabled()) {
            console.debug('[meta]', event, params, options);
        }
        return;
    }
    if (!window.fbq) return;
    if (options?.eventID) {
        window.fbq('track', event, params ?? {}, { eventID: options.eventID });
    } else {
        window.fbq('track', event, params ?? {});
    }
}

const PURCHASE_STORAGE_PREFIX = 'meta_purchase_';

/** Fire Meta Purchase once per order (refresh-safe). */
export function trackMetaPurchase(orderId: string, valueThb?: number | null): void {
    if (!orderId) return;
    try {
        const key = `${PURCHASE_STORAGE_PREFIX}${orderId}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
    } catch {
        /* private mode */
    }
    const params: MetaEventParams = { currency: 'THB', content_type: 'product' };
    if (typeof valueThb === 'number' && Number.isFinite(valueThb)) {
        params.value = Math.round(valueThb * 100) / 100;
    }
    trackMeta('Purchase', params, { eventID: orderId });
}

export function getViewport(): 'mobile' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    return window.matchMedia('(min-width: 768px)').matches ? 'desktop' : 'mobile';
}
