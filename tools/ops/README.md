# PimSuea Ops (local)

Local-only console for catalog management and after-order print prep.

## Setup

```bash
cd tools
pip install -r requirements-annotate.txt
```

Requires `backend/.env` with Supabase and Cloudflare R2 credentials (same as the main API). If that file is missing, the app shows a setup page at `/setup`.

You can also put the same variables in `tools/.env`.

## Run

```bash
cd tools
python -m venv .venv && .venv/bin/pip install -r requirements-annotate.txt
.venv/bin/python -m ops.app
```

Open **http://127.0.0.1:5051** (default; `tip_annotate_web.py` uses 5050)

### Migrate catalog assets from Supabase Storage → R2

When product gallery or canvas template URLs still point at `*.supabase.co/storage/...`, they count against Supabase cached egress. Copy them to R2 and rewrite DB URLs:

```bash
cd tools
.venv/bin/python -m ops.migrate_all_to_r2 --dry-run   # preview
.venv/bin/python -m ops.migrate_all_to_r2             # migrate all products
```

Or use **Migrate to R2** on each product in the ops UI (`/products/<id>`).

## Features

- **Products** — list, clone, edit metadata, gallery, templates (canvas + mockup), shirt pricing, print methods
- **R2 assets** — upload catalog images to `design-assets/catalog/{productId}/`; migrate Supabase template URLs to R2
- **Orders** — list/filter, update status + tracking, prepare print files from R2 using product mockup config + Tip annotate pipeline

Bind address defaults to `127.0.0.1` (override with `OPS_HOST` / `OPS_PORT` in `.env`).

## Analytics (`/analytics`)

Growth dashboard built from daily JSON snapshots in `tools/ops/data/analytics/` (gitignored; one file per day plus `latest.json`).

**Sources** (each one fails on its own; a missing key shows "not connected" plus setup steps in the UI):

| Source | What it gives | Config in `tools/.env` |
|---|---|---|
| Supabase | signups, designs, carts, checkouts, paid orders, coupons, self-reported channel, first-touch UTMs | already set via `backend/.env` |
| PostHog (HogQL) | visitors, landing pages, referrers, studio funnel, failures, canvas load time | `POSTHOG_PERSONAL_API_KEY` (scope `query:read`), `POSTHOG_PROJECT_ID`, `POSTHOG_HOST=https://eu.posthog.com` |
| Meta Marketing API | spend, impressions, CTR, CPC, CPM, pixel conversions per campaign / ad set / ad | `META_ACCESS_TOKEN` (System User, `ads_read`), `META_AD_ACCOUNT_ID=act_…`, optional `META_API_VERSION` |
| (optional) | margin and break-even CPA | `UNIT_COST_THB` |

Vercel Analytics has no supported query API, so it isn't pulled. PostHog covers the same pageviews.

**Refreshing**
- **Refresh now** on the page pulls everything in the background (about 10s).
- If the page opens after the 17:00 Bangkok slot and the snapshot is older, it refreshes on its own.
- Daily auto-pull: `bash ops/analytics/install_schedule.sh` installs a launchd job. It checks hourly and pulls once per day after 17:00 Bangkok, whatever the Mac's timezone. If the Mac was asleep, it runs on wake. Logs go to `data/analytics/schedule.log`. Uninstall with `--uninstall`.
- CLI: `.venv/bin/python -m ops.analytics.snapshot` (add `--if-due` to skip when already fresh).

**Ad attribution**: tag every ad as described in `docs/marketing/ads-utm.md`, so on-site signups and orders join to Meta campaigns, ad sets and ads.
