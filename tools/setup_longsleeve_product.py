#!/usr/bin/env python3
"""One-shot: long-sleeve tee — WebP upload, Supabase product (draft), pricing Strategy C."""

from __future__ import annotations

import io
import json
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
LONGSLEEVE = REPO / "longsleeve"
BOXY_PRODUCT_ID = "4e518b71-a23b-4841-aaea-d3fb924d999c"

sys.path.insert(0, str(REPO / "tools"))

from ops import products as products_svc  # noqa: E402
from ops import r2 as r2mod  # noqa: E402

# --- placement helpers (3:4 print zone, 30.48×40.64 cm) ---

CANVAS_PRINT = {
    "front": {"x": 935, "y": 404, "width": 434, "height": 579, "physical_w_cm": 30.48, "physical_h_cm": 40.64},
    "back": {"x": 935, "y": 320, "width": 434, "height": 579, "physical_w_cm": 30.48, "physical_h_cm": 40.64},
}

MOCKUP_PLACEMENT = {
    "front": {"x": 914.1, "y": 448.1, "w": 502.7, "h": 670.3},
    "back": {"x": 900.7, "y": 321.8, "w": 534.6, "h": 712.8},
}

TITLE_TH = "เสื้อแขนยาวคอตตอน 100% สกรีนลงเนื้อผ้า"
TITLE_EN = "Essential long sleeve cotton tee"

DETAILS = """Layered, not loud. A long-sleeve foundation built for print — crisp cotton, clean lines, and room for your artwork from one piece to a full drop.

เสื้อแขนยาวพื้นที่ดีสำหรับลายของคุณ — ผ้าคอตตอนเนื้อดี ทรงเรียบ ใส่เดี่ยวหรือซ้อนเลเยอร์ ตั้งแต่งาน 1 ตัวจนถึงทั้งทีม

The Colors / ตัวเลือกสี:
▫️ Alabaster White (ขาว): A true, clean white that keeps colour honest on the press.
▫️ Deep Black (ดำ): Saturated black — graphics read sharp, day or night.

The Specifications / ข้อมูลจำเพาะ:
▫️ Fabric (เนื้อผ้า): 100% cotton, combed C20 yarn — soft hand, stable surface for DTG.
▫️ Weight (น้ำหนักผ้า): 200–220 gsm — substantial without stiffness; holds shape through the day.
▫️ Fit (ทรงเสื้อ): Regular unisex fit (S–XL). Reference the size chart before you order.
▫️ Construction (งานเย็บ): Ribbed crew neck, set-in sleeves, reinforced collar — made to repeat-wear.
▫️ Print ready (รองรับงานพิมพ์): Tight knit optimized for our DTG workflow — fine lines and solid fills stay crisp."""

SIZE_GUIDE = {
    "S": {"Chest": 34, "Length": 27},
    "M": {"Chest": 38, "Length": 28},
    "L": {"Chest": 42, "Length": 29},
    "XL": {"Chest": 46, "Length": 30},
}

PRICING_TIERS = [
    (1, 11, 450, 480),
    (12, 29, 430, 460),
    (30, 59, 415, 445),
    (60, 99, 400, 430),
    (100, None, 385, 415),
]

SIZES = ["S", "M", "L", "XL"]

CANVAS_FILES = {
    ("white", "front"): "ls_white_front.png",
    ("white", "back"): "ls_white_back.png",
    ("black", "front"): "ls_black_front.png",
    ("black", "back"): "ls_black_back.png",
}

MOCKUP_FILES = {
    ("white", "front"): "mockup/white-longsleeve-front.png",
    ("white", "back"): "mockup/white-longsleeve-back.png",
    ("black", "front"): "mockup/black-longsleeve-front.png",
    ("black", "back"): "mockup/black-longsleeve-back.png",
}


def png_to_webp_bytes(path: Path, quality: int = 92) -> bytes:
    im = Image.open(path)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA")
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=quality, method=6)
    return buf.getvalue()


def upload_webp(product_id: str, path: Path, label: str) -> str:
    data = png_to_webp_bytes(path)
    key = f"{r2mod.catalog_prefix(product_id)}{label}_{path.stem}.webp"
    return r2mod.upload_bytes("design-assets", key, data, "image/webp")


def main() -> None:
    src = products_svc.get_product(BOXY_PRODUCT_ID)
    if not src:
        raise SystemExit("Boxy product not found")

    product_id = products_svc.clone_product(BOXY_PRODUCT_ID, TITLE_TH)
    from ops.db import get_db

    db = get_db()

    care = src.get("care_instructions") or ""

    db.table("products").update({
        "title": TITLE_TH,
        "title_en": TITLE_EN,
        "details": DETAILS,
        "care_instructions": care,
        "base_price": 450,
        "min_price": 385,
        "is_active": False,
        "is_beginner_friendly": src.get("is_beginner_friendly", False),
        "size_guide": SIZE_GUIDE,
    }).eq("id", product_id).execute()

    db.table("product_templates").delete().eq("product_id", product_id).execute()
    db.table("product_images").delete().eq("product_id", product_id).execute()
    db.table("shirt_pricing").delete().eq("product_id", product_id).execute()

    for color_id, side in [("white", "front"), ("white", "back"), ("black", "front"), ("black", "back")]:
        canvas_path = LONGSLEEVE / CANVAS_FILES[(color_id, side)]
        mock_path = LONGSLEEVE / MOCKUP_FILES[(color_id, side)]
        canvas_url = upload_webp(product_id, canvas_path, f"canvas/{side}_{color_id}")
        mock_url = upload_webp(product_id, mock_path, f"mockups/{side}_{color_id}")

        db.table("product_templates").insert({
            "product_id": product_id,
            "side": side,
            "color_id": color_id,
            "image_url": canvas_url,
            "print_area_config": CANVAS_PRINT[side],
            "mockup_config": {
                "image_url": mock_url,
                "placement": MOCKUP_PLACEMENT[side],
            },
            "is_default": side == "front" and color_id == "white",
        }).execute()

    hero_url = upload_webp(
        product_id,
        LONGSLEEVE / MOCKUP_FILES[("white", "front")],
        "gallery/hero_white_front",
    )
    db.table("product_images").insert({
        "product_id": product_id,
        "image_url": hero_url,
        "display_order": 0,
        "is_hover": False,
        "alt_text": "Long sleeve cotton tee white front",
    }).execute()

    for size in SIZES:
        for min_qty, max_qty, white_price, other_price in PRICING_TIERS:
            row = {
                "product_id": product_id,
                "color_name": "White",
                "size": size,
                "min_qty": min_qty,
                "max_qty": max_qty,
                "price_per_unit_thb": white_price,
            }
            db.table("shirt_pricing").insert(row).execute()
            row["color_name"] = "Other"
            row["price_per_unit_thb"] = other_price
            db.table("shirt_pricing").insert(row).execute()

    print(json.dumps({
        "product_id": product_id,
        "title": TITLE_TH,
        "is_active": False,
        "base_price": 450,
        "min_price": 385,
        "templates": 4,
        "pricing_rows": len(SIZES) * len(PRICING_TIERS) * 2,
    }, indent=2))
    print(f"\nStudio: /design-studio?productId={product_id}")
    print(f"Ops edit: product_id={product_id}")


if __name__ == "__main__":
    main()