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

**State Management:** React Context API only — no Redux/Zustand.
- `AuthContext` — Supabase auth session, `useAuth()` hook
- `CartContext` — Shopping cart persisted to `localStorage` under key `"pim_suea_cart"`, `useCart()` hook

**API Layer:** `src/services/api.ts` — Axios instance that automatically attaches the Supabase JWT (`session.access_token`) as a `Bearer` token on every request.

**Design Canvas:** Fabric.js (`DesignCanvas` page). Designs are serialized as JSON canvas data. A MD5 hash of the design JSON is stored as `design_hash` to avoid regenerating print files when nothing changed.

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
- `user_designs` — `canvas_data` (JSON), `preview_image_url`, `print_file_url`, `design_hash`, `is_ordered`, `available_colors`, `printing_type`
- `products`, `product_templates`, `categories`
- `orders`, `order_items`
- `transactions` (wallet)
- `articles`

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

### Preset Size Buttons (DesignCanvas)
- Located in the floating context toolbar when an object is selected
- `PRINT_TIERS` constant and `TIER_SAFETY_FACTOR = 0.97` near line 77 of `DesignCanvas.tsx`
- Safety factor reduces geometric target by 3% so that real image content (anti-aliased edges, shadows) stays within the tier boundary when printed
- `applyPresetSize(tier, axis)` resizes the selected object; the other axis scales proportionally

### Print File Annotation (`tools/annotate_print.py`)
- Admin tool: composites a print PNG onto a shirt mockup and annotates with inch measurements
- `PHYSICAL_W_IN = 12.0`, `PHYSICAL_H_IN = 16.0` (300 DPI → 3600 × 4800px export)
- `ALPHA_THRESHOLD = 200` — pixels with alpha ≤ 200 are ignored when measuring content bounds
- Dimension lines drawn in `ORANGE`; element bounding box in `BLUE_MUTED` (drawn first, behind)
- All labels: black bold text, no background pill

## SEO

Deployed at **pimsuea.com** on Vercel. Target: Thai + English speakers.
Domain registered and DNS managed via **Cloudflare**.

### Public routes (crawlable)
- `/` — waitlist/coming-soon page (`Landing.tsx`)
- `/home` — main landing page (`NewLanding.tsx`) — **canonical, priority 1.0**

All other routes are protected (login required) and blocked in `robots.txt`.

### Implementation
- **`src/components/PageSEO.tsx`** — reusable component; uses React 19 native head hoisting (no library). Props: `title`, `description`, `canonical`, `ogImage?`. Injects OG, Twitter Card, hreflang (th/en/x-default).
- **`index.html`** — base fallback meta tags (`lang="th"`, description, OG image, twitter:card).
- **`public/robots.txt`** — allows `/` and `/home`, disallows all protected routes.
- **`public/sitemap.xml`** — lists `/home` (priority 1.0) and `/` (priority 0.5) with hreflang entries.
- **JSON-LD** — Organization + WebSite schema rendered in `NewLanding.tsx` via `<script dangerouslySetInnerHTML>`.

### Pending manual steps
1. Create `public/og-image.png` (1200×630px) — logo + bilingual tagline ("Custom shirts, made simple. | สั่งทำเสื้อ ง่ายกว่าที่เคย")
2. Register in Google Search Console → submit `https://pimsuea.com/sitemap.xml`
3. Update `sitemap.xml` `lastmod` date when landing page content changes
