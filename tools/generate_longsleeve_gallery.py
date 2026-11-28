#!/usr/bin/env python3
"""Catalog hero + hover (print bounding box) for long sleeve product."""

from __future__ import annotations

import io
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
PRODUCT_ID = "b5378aed-801b-4f56-9fb9-1a84a44c8790"
SRC = REPO / "longsleeve" / "ls-model-shot.png"
OUT_DIR = REPO / "longsleeve"
TARGET = 2048  # match catalog sharpness

ORANGE = (245, 90, 42, 255)
FILL = (255, 107, 53, 45)
# Model is slightly right of frame; collar ~0.334. Match boxy hover (~21% wide, 3:4).
BOX_WIDTH_FRAC = 0.19
BOX_TOP_FRAC = 0.385
BOX_CENTER_X_FRAC = 0.545


def lanczos_square(im: Image.Image, size: int) -> Image.Image:
    im = im.convert("RGB")
    if im.size[0] != im.size[1]:
        side = min(im.size)
        left = (im.size[0] - side) // 2
        top = (im.size[1] - side) // 2
        im = im.crop((left, top, left + side, top + side))
    if im.size[0] != size:
        im = im.resize((size, size), Image.Resampling.LANCZOS)
    return im


def _dash_line(draw: ImageDraw.ImageDraw, p0, p1, color, width, dash=14, gap=10):
    x0, y0 = p0
    x1, y1 = p1
    length = math.hypot(x1 - x0, y1 - y0)
    if length < 1:
        return
    dx, dy = (x1 - x0) / length, (y1 - y0) / length
    pos = 0.0
    drawing = True
    while pos < length:
        seg = dash if drawing else gap
        end = min(pos + seg, length)
        if drawing:
            draw.line(
                [(x0 + dx * pos, y0 + dy * pos), (x0 + dx * end, y0 + dy * end)],
                fill=color,
                width=width,
            )
        pos = end
        drawing = not drawing


def dashed_rect(draw: ImageDraw.ImageDraw, box, color, width=5):
    x0, y0, x1, y1 = box
    _dash_line(draw, (x0, y0), (x1, y0), color, width)
    _dash_line(draw, (x1, y0), (x1, y1), color, width)
    _dash_line(draw, (x1, y1), (x0, y1), color, width)
    _dash_line(draw, (x0, y1), (x0, y0), color, width)


def chest_print_box(w: int, h: int) -> tuple[int, int, int, int]:
    bw = int(w * BOX_WIDTH_FRAC)
    bh = int(bw * 4 / 3)
    bx = int(w * BOX_CENTER_X_FRAC - bw / 2)
    by = int(h * BOX_TOP_FRAC)
    return bx, by, bw, bh


def add_print_zone(im: Image.Image) -> Image.Image:
    w, h = im.size
    bx, by, bw, bh = chest_print_box(w, h)
    overlay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    box = (bx, by, bx + bw, by + bh)
    od.rectangle(box, fill=FILL)
    dashed_rect(od, box, ORANGE, width=max(4, w // 400))
    base = im.convert("RGBA")
    out = Image.alpha_composite(base, overlay).convert("RGB")
    draw = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Italic.ttf", max(28, w // 28))
    except OSError:
        font = ImageFont.load_default()
    text = "Your Design"
    tb = draw.textbbox((0, 0), text, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    tx = bx + (bw - tw) // 2
    ty = by + (bh - th) // 2
    draw.text((tx, ty), text, fill=ORANGE[:3], font=font)
    return out


def to_webp_bytes(im: Image.Image, quality: int = 92) -> bytes:
    buf = io.BytesIO()
    im.save(buf, format="WEBP", quality=quality, method=6)
    return buf.getvalue()


def main() -> None:
    sys.path.insert(0, str(REPO / "tools"))
    from ops.db import get_db
    from ops import r2 as r2mod

    base = lanczos_square(Image.open(SRC), TARGET)
    hover = add_print_zone(base)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    base.save(OUT_DIR / "ls-model-shot.webp", format="WEBP", quality=92, method=6)
    hover.save(OUT_DIR / "ls-model-shot-hover.webp", format="WEBP", quality=92, method=6)

    hero_url = r2mod.upload_bytes(
        "design-assets",
        f"{r2mod.catalog_prefix(PRODUCT_ID)}gallery/ls_model_shot.webp",
        to_webp_bytes(base),
        "image/webp",
    )
    hover_url = r2mod.upload_bytes(
        "design-assets",
        f"{r2mod.catalog_prefix(PRODUCT_ID)}gallery/ls_model_shot_hover_v4.webp",
        to_webp_bytes(hover),
        "image/webp",
    )

    db = get_db()
    db.table("product_images").delete().eq("product_id", PRODUCT_ID).execute()
    db.table("product_images").insert({
        "product_id": PRODUCT_ID,
        "image_url": hero_url,
        "display_order": 1,
        "is_hover": False,
        "alt_text": "Essential long sleeve cotton tee — model front",
    }).execute()
    db.table("product_images").insert({
        "product_id": PRODUCT_ID,
        "image_url": hover_url,
        "display_order": 99,
        "is_hover": True,
        "alt_text": "Print area preview",
    }).execute()
    print({"hero_url": hero_url, "hover_url": hover_url})


if __name__ == "__main__":
    main()