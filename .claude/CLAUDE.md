# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PimSuea** is a full-stack print-on-demand design platform. Users browse a product catalog, create designs using a canvas editor, and place orders. It has two sub-projects:

- `pimsuea-frontend/` — React 19 + Vite + TypeScript frontend
- `backend/` — Express.js 5 backend API

## Commands

### Frontend (`pimsuea-frontend/`)
```bash
npm run dev       # Start dev server (Vite)
npm run build     # TypeScript compile + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Workflow Rules

**Before finishing any frontend task**, always run:
```bash
cd pimsuea-frontend && npm run build
```
This runs `tsc -b && vite build` — identical to the Vercel deploy command. The task is not complete until this passes with no errors. Fix any TypeScript errors before declaring done.

**Keep every file focused and lean (clean code rule).** Follow these principles on every task:
- Page files (`src/pages/`) contain layout and wiring only — no business logic, no inline component definitions.
- Any reusable component with its own markup or state belongs in its own file under `src/components/` (e.g. `src/components/canvas/`, `src/components/ui/`).
- Any non-trivial logic (state, effects, API calls, transformations) belongs in a dedicated hook under `src/hooks/`.
- Never define a component inside another component's file. If a new component is needed, create a new file and import it.
- If a file grows past ~200 lines, consider splitting it before adding more.

### Backend (`backend/`)
```bash
npm run dev       # Start with nodemon (hot reload)
npm start         # Start with node
```

Both must run simultaneously in development. The frontend defaults to `http://localhost:3000/api` for the backend.

## Architecture

### Frontend

**Routing:** React Router DOM. Pages live in `src/pages/`. Protected routes use the `ProtectedRoute` component backed by `AuthContext`.

**Launch gate (`App.tsx`):**
- `LAUNCH_DATE = new Date('2026-03-27T12:00:00+07:00')` — already past.
- Post-launch: `/` → `NewLanding`; `/home` → redirects to `/`. Pre-launch: `/` → `Landing` (waitlist), all other routes redirect to `/`.
- Dev mode bypasses the gate entirely (`import.meta.env.DEV`).

**State Management:** React Context API only — no Redux/Zustand.
- `AuthContext` — Supabase auth session, `useAuth()` hook
- `CartContext` — Shopping cart persisted to `localStorage` under key `"pim_suea_cart"`, `useCart()` hook

**API Layer:** `src/services/api.ts` — Axios instance that automatically attaches the Supabase JWT (`session.access_token`) as a `Bearer` token on every request.

**Design Studio:** `DesignStudio.tsx` at route `/studio/:id`. Canvas logic lives in `src/hooks/useCanvasDesign.ts`. Designs are serialized as JSON canvas data. A MD5 hash of the design JSON is stored as `design_hash` to avoid regenerating print files when nothing changed. Components in `src/components/canvas/`.

**UI:** shadcn/ui (new-york style, Radix UI primitives, Lucide icons, CSS variables). Path alias `@/` maps to `src/`.

### Backend

**Entry:** `backend/index.js` mounts all routes under `/api/`.

**Auth middleware:** `src/middleware/requireAuth.js` extracts the Bearer JWT and validates it. All non-public routes use this middleware.

**Supabase clients** (`src/config/supabaseClient.js`):
- `supabase` — public client (publishable key)
- `supabaseAdmin` — service-role client (secret key, bypasses RLS)
- `getAuthenticatedSupabase(token)` — creates a per-request client with the user's JWT to enforce RLS

**File uploads:** All uploads go through `POST /api/uploads`. Multer processes the file in memory (50MB limit), then the backend uploads to Supabase Storage. Three bucket types: `preview`, `print`, `asset`.

### Database (Supabase / PostgreSQL)

Key tables:
- `user_designs` — `canvas_data` (JSON), `preview_image_url` (**JSON map** of `{color_id: url}`, not a plain string — parse with `JSON.parse`), `print_file_url`, `design_hash`, `is_ordered`, `available_colors`, `printing_type`
- `products`, `product_templates`, `categories`
- `product_images` — `image_url`, `display_order`, `is_hover` (bool), `alt_text`. Rows with `is_hover = true` are used as the hover overlay image on catalog cards and product detail pages; they are excluded from the gallery images array.
- `orders`, `order_items` — `order_items` has `user_design_id` FK to `user_designs`
- `transactions` (wallet)
- `articles`
- `delivery_fees` — tiered delivery fee config (no code deploy needed to update rates)

RLS is enforced at the database level. The backend uses the user's JWT client for user-scoped data and the admin client only when necessary.

### Environment Variables

**Frontend** (`.env` in `pimsuea-frontend/`):
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
VITE_PUBLIC_GOOGLE_FONTS_API_KEY
VITE_API_URL   # optional, defaults to http://localhost:3000/api
```

**Backend** (`.env` in `backend/`):
```
PORT
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

## Key Patterns

- **Design save flow:** Generate canvas preview → hash design JSON → upload preview + print files via `/api/uploads` → upsert `user_designs` record. Skip print file regeneration if `design_hash` is unchanged.
- **Cart → Order flow:** Cart items carry `design_id`, `print_file_url`, `design_json`, `preview_url`. Creating an order posts cart items to `/api/orders`.
- **Google Fonts:** Loaded dynamically via `WebFontLoader` + `src/services/googleFonts.ts`. Font picker is a shared component at `src/components/FontPicker`.
- **Preview image parsing:** `preview_image_url` in `user_designs` is a JSON string `{"colorId": "url", ...}`. Always parse it — see `getFirstPreview()` helper in `MyProducts.tsx` and `MyOrders.tsx`.
- **Hover images:** Insert a row in `product_images` with `is_hover = true` to assign a hover image to a product. The backend filters these out of the `images[]` gallery array and surfaces them as `hover_image_url` on the product response.

## Print Sizing & Pricing

### Print Tiers
Tiers are defined by **strict** width × height (no rotation normalisation). A landscape design wider than 3" does NOT qualify as 3×4 — it goes to A5.

| Label | Width   | Height  | Backend (cm)         |
|-------|---------|---------|----------------------|
| 3×4   | ≤ 3"    | ≤ 4"    | w≤7.62, h≤10.16      |
| A5    | ≤ 6"    | ≤ 8"    | w≤15.24, h≤20.32     |
| A4    | ≤ 8"    | ≤ 12"   | w≤20.32, h≤30.48     |
| A3    | any     | any     | catch-all             |

- **Backend:** `backend/src/utils/pricing.js` → `getPrintTier(w_cm, h_cm)`
- **Annotation mirror:** `tools/annotate_print.py` → `get_print_tier(w_in, h_in)` (keep in sync)

### Preset Size Buttons (DesignStudio)
- Located in the floating context toolbar when an object is selected
- `PRINT_TIERS` constant and `TIER_SAFETY_FACTOR = 0.97` in `DesignStudio.tsx`
- Safety factor reduces geometric target by 3% so that real image content (anti-aliased edges, shadows) stays within the tier boundary when printed
- `applyPresetSize(tier, axis)` resizes the selected object; the other axis scales proportionally

### Delivery Fees
- Tiered by **total shirt quantity** in the order
- Configurable in `delivery_fees` DB table (no code deploy needed to change rates)
- Backend: `getDeliveryFee(totalQty)` in `backend/src/utils/pricing.js`
- Public API: `GET /api/delivery-fee?qty=N` → `{ fee, label }`

### Price Card (DesignStudio)
- `src/components/canvas/PriceCard.tsx` — shows live per-unit price breakdown
- Displays selected color name + hex swatch. If `color_name` is null → shows "ราคาเดียวทุกสี"
- Data flows via `CanvasPriceBreakdown` type in `src/types/canvas.ts`

## Admin Tools (`tools/`)

### Print File Annotation (`tools/annotate_print.py`)
- Composites a print PNG onto a shirt mockup and annotates with inch measurements
- `PHYSICAL_W_IN = 12.0`, `PHYSICAL_H_IN = 16.0` (300 DPI → 3600 × 4800px export)
- `ALPHA_THRESHOLD = 200` — pixels with alpha ≤ 200 are ignored when measuring content bounds
- Dimension lines drawn in `ORANGE`; element bounding box in `BLUE_MUTED` (drawn first, behind)
- All labels: black bold text, no background pill
- **Back side only:** `BACK_SHIRT_LEFT_PX = 169` — horizontal offset is measured from the shirt's left edge (not the center). If the back design is centered → no X annotation is shown at all.

### CMYK Conversion (`tools/rgb_to_cmyk.py`)
- Converts RGB print PNG(s) to CMYK TIFF for supplier submission
- Profile: `JapanColor2001Coated` (downloaded automatically to `tools/profiles/` on first run)
- Output: `<input>_cmyk.tif` alongside the original, LZW-compressed, 300 DPI metadata embedded
- Rendering intent: Relative Colorimetric + Black Point Compensation
- Set `INPUT_PATH` or `BATCH_PATHS` at the top, then run: `python tools/rgb_to_cmyk.py`

## SEO

Deployed at **pimsuea.com** on Vercel. Target: Thai + English speakers.
Domain registered and DNS managed via **Cloudflare**.

### Public routes (crawlable)
- `/` — **main landing page post-launch** (`NewLanding.tsx`), canonical `https://pimsuea.com/`
- `/home` — redirects to `/` (not in sitemap)

All other routes are protected (login required) and blocked in `robots.txt`.

### Implementation
- **`src/components/PageSEO.tsx`** — reusable component; uses React 19 native head hoisting (no library). Props: `title`, `description`, `canonical`, `ogImage?`. Injects OG (`og:locale = th_TH`), Twitter Card, hreflang (th/en/x-default).
- **`index.html`** — base fallback meta tags (`lang="th"`, description, OG image, twitter:card, `theme-color = #08636D`).
- **`public/robots.txt`** — allows `/`, disallows all protected routes.
- **`public/sitemap.xml`** — single entry: `/` (priority 1.0, NewLanding post-launch).
- **JSON-LD** — Organization + WebSite schema rendered in `NewLanding.tsx` via `<script dangerouslySetInnerHTML>`.

### Pending manual steps
1. Create `public/og-image.png` (1200×630px) — logo + bilingual tagline ("Custom shirts, made simple. | สั่งทำเสื้อ ง่ายกว่าที่เคย")
2. Register in Google Search Console → submit `https://pimsuea.com/sitemap.xml`
3. Update `sitemap.xml` `lastmod` date when landing page content changes
