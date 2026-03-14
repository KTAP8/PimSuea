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
