#!/usr/bin/env python3
"""Migrate product gallery + canvas/mockup URLs from Supabase Storage to R2.

Uses backend/.env for Supabase + R2 credentials (same as ops console).

Usage:
    cd tools
    pip install -r requirements-annotate.txt   # once
    python -m ops.migrate_all_to_r2            # all products
    python -m ops.migrate_all_to_r2 --product-id <uuid>   # one product
    python -m ops.migrate_all_to_r2 --dry-run  # list URLs that would move
"""
from __future__ import annotations

import argparse
import sys

from . import products as products_svc


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate catalog assets from Supabase Storage to R2")
    parser.add_argument("--product-id", action="append", dest="product_ids", help="Migrate one product (repeatable)")
    parser.add_argument("--dry-run", action="store_true", help="Print Supabase URLs without uploading")
    args = parser.parse_args()

    product_ids = args.product_ids
    if not product_ids:
        product_ids = [p["id"] for p in products_svc.list_products()]

    if not product_ids:
        print("No products found.", file=sys.stderr)
        return 1

    total = {"templates": 0, "images": 0, "mockups": 0}

    for pid in product_ids:
        product = products_svc.get_product(pid)
        title = (product or {}).get("title", pid)

        if args.dry_run:
            tpls = products_svc.get_product_templates(pid)
            imgs = products_svc.get_product_images(pid)
            from . import r2 as r2mod

            pending = []
            for tpl in tpls:
                if tpl.get("image_url") and not r2mod.get_location_from_url(tpl["image_url"]):
                    pending.append(("template", tpl["image_url"]))
                mock = (tpl.get("mockup_config") or {}).get("image_url")
                if mock and not r2mod.get_location_from_url(mock):
                    pending.append(("mockup", mock))
            for img in imgs:
                if img.get("image_url") and not r2mod.get_location_from_url(img["image_url"]):
                    pending.append(("gallery", img["image_url"]))
            print(f"\n{title} ({pid}): {len(pending)} asset(s) to migrate")
            for kind, url in pending:
                print(f"  [{kind}] {url}")
            continue

        counts = products_svc.migrate_product_assets_to_r2(pid)
        for k, v in counts.items():
            total[k] += v
        print(f"{title}: templates={counts['templates']}, mockups={counts['mockups']}, gallery={counts['images']}")

    if not args.dry_run:
        print(
            f"\nDone. Migrated templates={total['templates']}, "
            f"mockups={total['mockups']}, gallery={total['images']}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
