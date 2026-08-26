#!/usr/bin/env python3
"""Rewrite stored URLs from *.r2.cloudflarestorage.com to pub-*.r2.dev public bases.

Run after fixing R2_PUBLIC_URL_* in backend/.env (must use pub-*.r2.dev, not S3 API URLs).

Usage:
    cd tools
    .venv/bin/python -m ops.fix_r2_public_urls --dry-run
    .venv/bin/python -m ops.fix_r2_public_urls
"""
from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv

from .db import get_db

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / "backend" / ".env", override=False)

S3_BASE = re.compile(
    r"https://[a-f0-9]+\.r2\.cloudflarestorage\.com/(design-previews|design-assets|print-files|print-files-ordered)/"
)


def public_base_for_bucket(bucket: str) -> str | None:
    env_map = {
        "design-previews": "R2_PUBLIC_URL_PREVIEWS",
        "design-assets": "R2_PUBLIC_URL_ASSETS",
        "print-files": "R2_PUBLIC_URL_PRINT",
        "print-files-ordered": "R2_PUBLIC_URL_PRINT_ORDERED",
    }
    key = env_map.get(bucket)
    if not key:
        return None
    base = os.getenv(key, "").rstrip("/")
    if not base or "cloudflarestorage.com" in base:
        return None
    return f"{base}/"


def rewrite_url(url: str) -> str | None:
    if not url or "cloudflarestorage.com" not in url:
        return None
    m = S3_BASE.search(url)
    if not m:
        return None
    bucket = m.group(1)
    pub = public_base_for_bucket(bucket)
    if not pub:
        raise RuntimeError(f"No pub-*.r2.dev base configured for bucket {bucket}")
    return S3_BASE.sub(pub, url, count=1)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    db = get_db()
    changed = 0

    for row in db.table("product_images").select("id, image_url").execute().data or []:
        new_url = rewrite_url(row.get("image_url") or "")
        if not new_url:
            continue
        changed += 1
        print(f"product_images {row['id']}: {new_url}")
        if not args.dry_run:
            db.table("product_images").update({"image_url": new_url}).eq("id", row["id"]).execute()

    for row in db.table("product_templates").select("id, image_url, mockup_config").execute().data or []:
        updates: dict = {}
        new_img = rewrite_url(row.get("image_url") or "")
        if new_img:
            updates["image_url"] = new_img
        mockup = row.get("mockup_config")
        if isinstance(mockup, str):
            try:
                mockup = json.loads(mockup)
            except json.JSONDecodeError:
                mockup = None
        if isinstance(mockup, dict) and mockup.get("image_url"):
            new_mock = rewrite_url(mockup["image_url"])
            if new_mock:
                mockup = {**mockup, "image_url": new_mock}
                updates["mockup_config"] = mockup
        if not updates:
            continue
        changed += 1
        print(f"product_templates {row['id']}: {updates}")
        if not args.dry_run:
            db.table("product_templates").update(updates).eq("id", row["id"]).execute()

    print(f"{'Would update' if args.dry_run else 'Updated'} {changed} row(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
