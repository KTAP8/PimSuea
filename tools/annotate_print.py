"""
annotate_print.py — Admin tool for annotating print files with measurements.

Usage:
  1. Set INPUT_PATH to your 300 DPI print PNG.
  2. Run:  python tools/annotate_print.py
  3. Opens <input>_annotated.png with dotted-line overlays and cm labels.

Dependencies:
  pip install pillow numpy
"""

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ─── CONFIG ──────────────────────────────────────────────────────────────────
INPUT_PATH    = "/Volumes/My Passport/Personal_Project/PimSuea/tools/test_data/IBC_back_printfile.png"   # ← set this
OUTPUT_PATH   = None                        # None = auto: <input>_annotated.png
PHYSICAL_W_CM = 30.48                       # 12 inches
PHYSICAL_H_CM = 40.64                       # 16 inches

ALPHA_THRESHOLD = 10   # pixels with alpha <= this are treated as empty
WHITE_THRESHOLD = 245  # for RGB images: channels all above this = background

# Visual style (applied at preview scale)
ORANGE      = (255, 107, 53, 255)
DARK_BG     = (0, 0, 0, 165)
WHITE       = (255, 255, 255, 255)
DASH_LEN    = 12
GAP_LEN     = 7
LINE_W      = 2
FONT_SIZE   = 14
PAD         = 14        # spacing between annotation lines and the bounding box
TICK        = 8         # tick mark half-length
PREVIEW_DIV = 6         # downscale divisor: 3600/6 = 600px wide preview
MARGIN_LEFT = 150       # left margin reserved for Y measurement line + label
MARGIN_TOP  = 60        # top margin reserved for X offset line + label
# ─────────────────────────────────────────────────────────────────────────────


def get_print_tier(w_cm: float, h_cm: float) -> str:
    """Mirror of getPrintTier in backend/src/utils/pricing.js."""
    short, long_ = sorted([w_cm, h_cm])
    # Custom inch-based tiers: 3x4in, A5=6x8in, A4=8x12in, A3=12x16in (catch-all)
    if short <= 7.62  and long_ <= 10.16: return "3x4in"
    if short <= 15.24 and long_ <= 20.32: return "A5"
    if short <= 20.32 and long_ <= 30.48: return "A4"
    return "A3"


def find_content_bbox(img: Image.Image):
    """Return (x_min, y_min, x_max, y_max) of non-empty content in pixels."""
    arr = np.array(img)
    if arr.shape[2] == 4:
        mask = arr[:, :, 3] > ALPHA_THRESHOLD
    else:
        mask = ~((arr[:, :, 0] > WHITE_THRESHOLD) &
                 (arr[:, :, 1] > WHITE_THRESHOLD) &
                 (arr[:, :, 2] > WHITE_THRESHOLD))

    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any():
        raise ValueError("No content found in the print file — image appears empty.")
    y_idx = np.where(rows)[0]; y_min, y_max = int(y_idx[0]), int(y_idx[-1])
    x_idx = np.where(cols)[0]; x_min, x_max = int(x_idx[0]), int(x_idx[-1])
    return x_min, y_min, x_max, y_max


def draw_dashed_line(draw, x1, y1, x2, y2, dash=DASH_LEN, gap=GAP_LEN,
                     color=ORANGE, width=LINE_W):
    """Draw a dashed line between two points."""
    dx, dy = x2 - x1, y2 - y1
    length = (dx**2 + dy**2) ** 0.5
    if length == 0:
        return
    ux, uy = dx / length, dy / length
    pos = 0.0
    drawing = True
    while pos < length:
        seg = dash if drawing else gap
        end = min(pos + seg, length)
        if drawing:
            draw.line(
                [(x1 + ux * pos, y1 + uy * pos),
                 (x1 + ux * end, y1 + uy * end)],
                fill=color, width=width
            )
        pos = end
        drawing = not drawing


def draw_label(draw, text, cx, cy, font):
    """Draw text with a dark pill background, centered at (cx, cy)."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = 4
    rx0, ry0 = cx - tw // 2 - pad, cy - th // 2 - pad
    rx1, ry1 = cx + tw // 2 + pad, cy + th // 2 + pad
    draw.rectangle([rx0, ry0, rx1, ry1], fill=DARK_BG)
    draw.text((cx - tw // 2, cy - th // 2), text, fill=WHITE, font=font)


def annotate(input_path: str, output_path: str | None = None):
    src = Path(input_path)
    if not src.exists():
        raise FileNotFoundError(f"Not found: {input_path}")

    out = Path(output_path) if output_path else src.with_stem(src.stem + "_annotated")

    # ── Load & measure ──────────────────────────────────────────────────────
    img_full = Image.open(src).convert("RGBA")
    W, H = img_full.size
    px_to_cm = PHYSICAL_W_CM / W          # cm per pixel (full resolution)
    center_x = W / 2

    x_min, y_min, x_max, y_max = find_content_bbox(img_full)

    elem_w_cm   = (x_max - x_min) * px_to_cm
    elem_h_cm   = (y_max - y_min) * px_to_cm
    y_cm        = y_min * px_to_cm
    x_offset_cm = abs(x_min - center_x) * px_to_cm
    x_dir       = ("right" if x_min > center_x + 1
                   else "left" if x_min < center_x - 1
                   else "centered")
    tier        = get_print_tier(elem_w_cm, elem_h_cm)

    # ── Console summary ──────────────────────────────────────────────────────
    print(f"\n{'─'*48}")
    print(f"  File       : {src.name}")
    print(f"  Image size : {W} × {H} px  ({PHYSICAL_W_CM} × {PHYSICAL_H_CM:.2f} cm)")
    print(f"  1 px       = {px_to_cm*10:.4f} mm")
    print(f"{'─'*48}")
    print(f"  Element    : {elem_w_cm:.2f} cm × {elem_h_cm:.2f} cm  [{tier}]")
    print(f"  Y from top : {y_cm:.2f} cm")
    print(f"  X offset   : {x_offset_cm:.2f} cm {'' if x_dir == 'centered' else x_dir}")
    print(f"{'─'*48}\n")

    # ── Build preview canvas at 1/PREVIEW_DIV scale ──────────────────────────
    scale = 1 / PREVIEW_DIV
    pw, ph = max(1, int(W * scale)), max(1, int(H * scale))

    # Downscale the original image as background (keep transparency)
    thumb = img_full.resize((pw, ph), Image.LANCZOS).convert("RGBA")

    # Expand canvas with margins so annotations always have room
    total_w = pw + MARGIN_LEFT
    total_h = ph + MARGIN_TOP
    canvas = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    canvas.paste(thumb, (MARGIN_LEFT, MARGIN_TOP), mask=thumb)

    draw = ImageDraw.Draw(canvas)

    # Scaled + offset coordinates (origin = top-left of the image area)
    def s(v): return int(v * scale)
    ox, oy = MARGIN_LEFT, MARGIN_TOP   # image origin in the expanded canvas

    bx0, by0 = ox + s(x_min), oy + s(y_min)
    bx1, by1 = ox + s(x_max), oy + s(y_max)
    cx_s  = ox + s(center_x)
    # top of the image area in the expanded canvas
    img_top = oy

    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", FONT_SIZE)
    except Exception:
        font = ImageFont.load_default()

    # 0. Print area border
    draw.rectangle([ox, oy, ox + pw - 1, oy + ph - 1], outline=(180, 180, 180), width=1)

    # 1. Dotted bounding box
    for (ax, ay, bx, by) in [
        (bx0, by0, bx1, by0),
        (bx1, by0, bx1, by1),
        (bx1, by1, bx0, by1),
        (bx0, by1, bx0, by0),
    ]:
        draw_dashed_line(draw, ax, ay, bx, by, color=ORANGE)

    # 2. Y measurement — vertical line in left margin, from print-area top to element top
    vx = MARGIN_LEFT // 2
    draw_dashed_line(draw, vx, img_top, vx, by0, color=ORANGE)
    draw.line([(vx - TICK, img_top), (vx + TICK, img_top)], fill=ORANGE, width=LINE_W)
    draw.line([(vx - TICK, by0),     (vx + TICK, by0)],     fill=ORANGE, width=LINE_W)
    # Horizontal connector from the left margin line to the element's top edge
    draw_dashed_line(draw, vx, by0, bx0, by0, color=ORANGE)
    mid_y = (img_top + by0) // 2
    y_label = "0.0 cm from top" if y_cm < 0.05 else f"{y_cm:.1f} cm from top"
    draw_label(draw, y_label, MARGIN_LEFT // 2, mid_y, font)

    # 3. X offset — horizontal line in top margin, from area center-x to element left edge
    hy = MARGIN_TOP // 2
    draw_dashed_line(draw, cx_s, hy, bx0, hy, color=ORANGE)
    draw.line([(cx_s, hy - TICK), (cx_s, hy + TICK)], fill=ORANGE, width=LINE_W)
    draw.line([(bx0,  hy - TICK), (bx0,  hy + TICK)], fill=ORANGE, width=LINE_W)
    # Vertical connector from top margin line down to element's top-left corner
    draw_dashed_line(draw, bx0, hy, bx0, by0, color=ORANGE)
    x_label = ("centered" if x_dir == "centered"
               else f"{x_offset_cm:.1f} cm {x_dir}")
    draw_label(draw, x_label, (cx_s + bx0) // 2, hy // 2 + 4, font)

    # 4. Size + tier label below the bounding box
    size_text = f"{elem_w_cm:.1f} × {elem_h_cm:.1f} cm  [{tier}]"
    draw_label(draw, size_text, (bx0 + bx1) // 2, by1 + PAD + FONT_SIZE // 2, font)

    canvas.save(out)
    print(f"  Saved → {out}\n")


if __name__ == "__main__":
    annotate(INPUT_PATH, OUTPUT_PATH)
