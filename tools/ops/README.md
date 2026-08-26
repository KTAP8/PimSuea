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
