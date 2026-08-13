# PimSuea

Custom print-on-demand platform for Thailand. Customers browse a product catalog, design shirts in a browser-based canvas editor, see live pricing, and place orders. The site is bilingual (Thai / English).

**Production:** [pimsuea.com](https://pimsuea.com)

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Konva |
| Backend | Node.js, Express 5 |
| Database & auth | Supabase (PostgreSQL + Auth) |
| File storage | Cloudflare R2 |
| Email | Resend (waitlist / notifications) |
| Frontend hosting | Vercel |
| Backend hosting | Render (or any Node host) |
| DNS | Cloudflare |

## Repository structure

```
PimSuea/
├── pimsuea-frontend/   # React SPA (Vite)
├── backend/            # Express API (mounted at /api)
├── tools/              # Offline print-prep scripts (Python)
└── README.md
```

## Prerequisites

- **Node.js** 20+ and npm
- **Supabase** project (database, auth, optional storage)
- **Cloudflare R2** buckets for design previews, print files, and assets
- **Google Fonts API key** (optional, for font picker in the design studio)

For local development you only need Node.js and valid `.env` files. External services must be configured with your own credentials.

## Local development

### 1. Clone and install

```bash
git clone https://github.com/KTAP8/PimSuea.git
cd PimSuea

cd backend && npm install
cd ../pimsuea-frontend && npm install
```

### 2. Environment variables

Copy the example files and fill in your credentials (never commit `.env` files):

```bash
cp backend/.env.example backend/.env
cp pimsuea-frontend/.env.example pimsuea-frontend/.env
```

See [`backend/.env.example`](backend/.env.example) and [`pimsuea-frontend/.env.example`](pimsuea-frontend/.env.example) for the full list. Minimum for local dev:

| Variable | Where | Required? |
|----------|-------|-----------|
| `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` | backend | Yes — without both, API uses a mock Supabase client |
| `SUPABASE_SECRET_KEY` | backend | Yes — admin routes (orders, waitlist, etc.) |
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | frontend | Yes — auth and direct Supabase reads |
| R2 `CLOUDFLARE_*` / `R2_*` vars | backend | Yes — design uploads and print files |
| `RESEND_API_KEY` | backend | No — server starts without it; waitlist emails are skipped |
| `VITE_API_URL` | frontend | No — defaults to `http://localhost:3000/api` |

**Where to find Supabase keys:** Supabase dashboard → Project Settings → API → Project URL, `anon` (publishable), and `service_role` (secret).

**Troubleshooting startup:**

- `Supabase URL or Publishable Key is missing` — add `SUPABASE_PUBLISHABLE_KEY` to `backend/.env` (having only `SUPABASE_SECRET_KEY` is not enough).
- Waitlist works without `RESEND_API_KEY`; confirmation emails are skipped until you add a key from [resend.com](https://resend.com).

### 3. Run both servers

Use two terminals:

```bash
# Terminal 1 — API (default http://localhost:3000)
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend (default http://localhost:5173)
cd pimsuea-frontend
npm run dev
```

The frontend calls the API at `VITE_API_URL` or falls back to `http://localhost:3000/api`.

### 4. Verify

- Backend health: open `http://localhost:3000` — should return `PimSuea Backend API is running!`
- Frontend: open `http://localhost:5173`
- Production build check:

```bash
cd pimsuea-frontend
npm run build
```

## Deployment

### Frontend (Vercel)

The frontend is a static Vite SPA deployed on **Vercel** with SPA routing via [`pimsuea-frontend/vercel.json`](pimsuea-frontend/vercel.json).

1. Connect the GitHub repo to Vercel.
2. Set **Root Directory** to `pimsuea-frontend`.
3. **Build command:** `npm run build`
4. **Output directory:** `dist`
5. Add environment variables in the Vercel dashboard (same `VITE_*` keys as local `.env`).
6. Set `VITE_API_URL` to your production API URL, e.g. `https://your-backend.onrender.com/api`.
7. Point your domain (`pimsuea.com`) to Vercel in Cloudflare DNS.

After deploy, confirm the landing page loads and authenticated flows (login, catalog, studio) reach the live API.

### Backend (Render or similar)

The API is a standard Node/Express app. It is intended to run on **Render** (see commented `VITE_API_URL` in frontend env examples).

1. Create a **Web Service** on Render (or Railway, Fly.io, etc.).
2. Set **Root Directory** to `backend`.
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. Add all backend environment variables from the table above.
6. Set `FRONTEND_URL=https://pimsuea.com` so CORS / origin checks include production.
7. Copy the public service URL and set `VITE_API_URL=https://<your-service>/api` on Vercel.

Redeploy the frontend after changing `VITE_API_URL`.

### Supabase

- Run schema migrations and seed data in the Supabase SQL editor as needed.
- Enable Row Level Security policies for user-scoped tables (`user_designs`, `orders`, etc.).
- Configure Supabase Auth redirect URLs for production (`https://pimsuea.com`) and local dev (`http://localhost:5173`).

Example maintenance migration: [`backend/migrations/remove_dtf_from_products.sql`](backend/migrations/remove_dtf_from_products.sql).

### Cloudflare R2

Create buckets (or prefixes) for:

- Design previews
- Print files (draft)
- Print files (ordered / production)
- User-uploaded assets

Set the public URLs in backend `R2_PUBLIC_URL_*` variables. Upload credentials go in `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`.

## Common scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `pimsuea-frontend/` | `npm run dev` | Dev server with HMR |
| `pimsuea-frontend/` | `npm run build` | Typecheck + production build |
| `pimsuea-frontend/` | `npm run lint` | ESLint |
| `pimsuea-frontend/` | `npm run preview` | Preview production build locally |
| `backend/` | `npm run dev` | API with nodemon |
| `backend/` | `npm start` | API (production) |

## Print production tools

Offline Python scripts in [`tools/`](tools/) support the print workflow:

- [`tools/annotate_print.py`](tools/annotate_print.py) — overlay designs on mockups with inch measurements
- [`tools/rgb_to_cmyk.py`](tools/rgb_to_cmyk.py) — convert RGB PNGs to CMYK TIFF for suppliers
- [`tools/README_tip_annotate.md`](tools/README_tip_annotate.md) — usage notes

These are run locally by operators; they are not part of the web deploy.

## Architecture notes

- **Auth:** Supabase JWT is sent as `Authorization: Bearer <token>` on API requests from the frontend.
- **Design studio:** Route `/studio/:productId` — canvas state saved to `user_designs` with preview and print files in R2.
- **Pricing:** Shirt + print pricing from Supabase tables; tier derived from design dimensions (see `backend/src/utils/pricing.js`).
- **Printing:** New orders use **DTG** only. Legacy DTF designs remain viewable but cannot be checked out.

## License

Private project. All rights reserved unless stated otherwise.
