import { track, getViewport } from './analytics';

export type StudioSource =
    | 'catalog'
    | 'my_products'
    | 'dashboard'
    | 'existing_design'
    | 'unknown';

export type StudioLastAction =
    | 'none'
    | 'upload'
    | 'library'
    | 'save'
    | 'preview'
    | 'order'
    | 'back';

export interface StudioSessionContext {
    product_id: string;
    design_id?: string | null;
    is_existing: boolean;
    printing_type: string;
    source: StudioSource;
}

interface StudioSessionState extends StudioSessionContext {
    opened_at: number;
    last_action: StudioLastAction;
    canvas_ready_fired: boolean;
    left_fired: boolean;
}

let session: StudioSessionState | null = null;

function baseProps(): AnalyticsProps {
    if (!session) return { viewport: getViewport() };
    return {
        product_id: session.product_id,
        design_id: session.design_id ?? null,
        is_existing: session.is_existing,
        printing_type: session.printing_type,
        source: session.source,
        viewport: getViewport(),
    };
}

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function startStudioSession(ctx: StudioSessionContext): void {
    session = {
        ...ctx,
        opened_at: Date.now(),
        last_action: 'none',
        canvas_ready_fired: false,
        left_fired: false,
    };
    track('studio_opened', baseProps());
}

export function setStudioLastAction(action: StudioLastAction): void {
    if (session) session.last_action = action;
}

export function trackStudioCanvasReady(timeToReadyMs: number): void {
    if (!session || session.canvas_ready_fired) return;
    session.canvas_ready_fired = true;
    track('studio_canvas_ready', { ...baseProps(), time_to_ready_ms: timeToReadyMs });
}

export function trackStudioArtworkAdded(method: 'upload' | 'library', layerCount: number): void {
    setStudioLastAction(method);
    track('studio_artwork_added', { ...baseProps(), method, layer_count: layerCount });
}

export function trackStudioPreviewOpened(): void {
    setStudioLastAction('preview');
    track('studio_preview_opened', baseProps());
}

export function trackStudioSaveSucceeded(isFirstSave: boolean): void {
    setStudioLastAction('save');
    track('studio_save_succeeded', { ...baseProps(), is_first_save: isFirstSave });
}

export function trackStudioSaveBlockedName(): void {
    track('studio_save_blocked_name', baseProps());
}

export function trackStudioSaveFailed(status?: number, reason?: string): void {
    track('studio_save_failed', { ...baseProps(), http_status: status ?? null, reason: reason ?? 'unknown' });
}

export function trackStudioOrderOpened(): void {
    setStudioLastAction('order');
    track('studio_order_opened', baseProps());
}

export function trackStudioAddToCart(wentToCheckout: boolean): void {
    track('studio_add_to_cart', { ...baseProps(), went_to_checkout: wentToCheckout });
}

export function trackStudioAddToCartFailed(reason?: string): void {
    track('studio_add_to_cart_failed', { ...baseProps(), reason: reason ?? 'unknown' });
}

export function trackStudioLeft(opts: {
    had_artwork: boolean;
    is_dirty: boolean;
    exit_type: 'back' | 'leave_modal' | 'pagehide';
}): void {
    if (!session || session.left_fired) return;
    session.left_fired = true;
    if (opts.exit_type === 'back' || opts.exit_type === 'leave_modal') {
        setStudioLastAction('back');
    }
    track('studio_left', {
        ...baseProps(),
        had_artwork: opts.had_artwork,
        is_dirty: opts.is_dirty,
        duration_ms: Date.now() - session.opened_at,
        last_action: session.last_action,
        exit_type: opts.exit_type,
    });
}

export function trackStudioCanvasBlank(reason: 'timeout' | 'container_too_small'): void {
    track('studio_canvas_blank', { ...baseProps(), reason });
}

export function trackStudioTemplateLoadFailed(): void {
    track('studio_template_load_failed', baseProps());
}

export function trackStudioArtworkRestoreFailed(restored: number, expected: number): void {
    track('studio_artwork_restore_failed', { ...baseProps(), restored, expected });
}

export function trackStudioUploadFailed(reason?: string): void {
    track('studio_upload_failed', { ...baseProps(), reason: reason ?? 'unknown' });
}

export function trackStudioMockupFailed(reason?: string): void {
    track('studio_mockup_failed', { ...baseProps(), reason: reason ?? 'unknown' });
}

export function endStudioSession(): void {
    session = null;
}
