# PostHog dashboards — Design Studio churn

Set up these dashboards after `VITE_PUBLIC_POSTHOG_KEY` is configured and studio events are flowing in production (or with `VITE_ANALYTICS_DEBUG=true` locally).

## Environment

Add to `pimsuea-frontend/.env`:

```env
VITE_PUBLIC_POSTHOG_KEY=phc_...
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Optional local testing:

```env
VITE_ANALYTICS_DEBUG=true
```

## Event catalog

| Event | When it fires |
|-------|----------------|
| `studio_opened` | User enters `/studio/:id` |
| `studio_canvas_ready` | Shirt template + background loaded |
| `studio_artwork_added` | User uploads or picks from library |
| `studio_preview_opened` | Mockup preview generated |
| `studio_save_succeeded` | Design saved |
| `studio_save_blocked_name` | Save blocked (Untitled Design name) |
| `studio_order_opened` | Order panel opened |
| `studio_add_to_cart` | Added to cart (with `went_to_checkout`) |
| `studio_left` | Back, leave modal confirm, or tab close |
| `studio_canvas_blank` | Template set but no bg after 8s, or container too small |
| `studio_template_load_failed` | Template image failed to load |
| `studio_artwork_restore_failed` | Saved layer(s) failed to restore |
| `studio_upload_failed` | Asset upload failed |
| `studio_save_failed` | Save API failed |
| `studio_mockup_failed` | Mockup generation failed |
| `studio_add_to_cart_failed` | Add to cart failed |

Shared properties on studio events: `product_id`, `design_id`, `is_existing`, `printing_type`, `source`, `viewport` (`mobile` / `desktop`).

## Dashboard 1 — Studio conversion funnel

**Type:** Funnel

**Steps (in order):**

1. `studio_opened`
2. `studio_canvas_ready`
3. `studio_artwork_added`
4. `studio_save_succeeded`
5. `studio_add_to_cart`

**Breakdowns to add:**

- `viewport` (mobile vs desktop)
- `is_existing` (new design vs reopening saved design)
- `source` (`catalog`, `my_products`, `dashboard`, `existing_design`)

**What to look for:** Largest drop between steps 2→3 (never added art) or 3→4 (added art but didn’t save).

## Dashboard 2 — Failure board

**Type:** Trends (last 7 days)

**Series (one chart or separate tiles):**

- `studio_canvas_blank`
- `studio_template_load_failed`
- `studio_artwork_restore_failed`
- `studio_upload_failed`
- `studio_save_failed`
- `studio_mockup_failed`
- `studio_add_to_cart_failed`

**Breakdown:** `viewport`, `reason` (where available)

**What to look for:** Spikes in `studio_canvas_blank` or `studio_artwork_restore_failed` after deploys.

## Dashboard 3 — Session replay playlist

**Type:** Session replay filter / playlist

Create saved filters for sessions where **any** of:

- `studio_left` with `had_artwork = false` (bounced without designing)
- `studio_canvas_blank`
- `studio_template_load_failed`
- `studio_artwork_restore_failed`
- `studio_save_failed`

**URL filter:** path contains `/studio/`

**What to look for:** Users staring at blank canvas, repeated failed uploads, or save errors.

## Dashboard 4 — Save blocked (hidden churn)

**Type:** Trend

**Event:** `studio_save_blocked_name`

Often mistaken for “Save is broken” when the design name is still “Untitled Design”.

## Enable session replay

In PostHog project settings → **Session replay**:

- Enable recording
- Optional: record only when URL matches `/studio/` to reduce volume

## Privacy notes

- Events do **not** include canvas image data, `canvas_data`, or asset URLs.
- PostHog inputs are masked in session replay (`maskAllInputs: true`).
- Users are identified by Supabase user id only.
