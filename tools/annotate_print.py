"""
annotate_print.py — Admin tool for annotating print files with measurements
                    and compositing them onto shirt mockups.

Usage:
  1. Set INPUT_PATH to your 300 DPI print PNG.
  2. Set SHIRT_COLOR ('white' or 'black') and SHIRT_SIDE ('front' or 'back').
  3. Place mockup images in tools/mockups/ as white_front.png, black_back.png, etc.
     (or set MOCKUP_IMAGE_PATH directly to override).
  4. Run:  python tools/annotate_print.py
  5. Outputs:
       <input>_annotated.png   — dotted-line overlays + inch labels
       <input>_mockup_<side>.png — design composited on shirt

Dependencies:
  pip install pillow numpy
"""

from pathlib import Path
from io import BytesIO
import urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ─── CONFIG ──────────────────────────────────────────────────────────────────
INPUT_PATH    = "/Volumes/My Passport/Personal_Project/PimSuea/tools/test_data/test_pim2.png"   # ← set this
OUTPUT_PATH   = None                        # None = auto: <input>_annotated.png
PHYSICAL_W_IN = 12.0                        # inches
PHYSICAL_H_IN = 16.0                        # inches

ALPHA_THRESHOLD = 200  # pixels with alpha <= this are treated as empty (higher = ignores antialiased edges)
WHITE_THRESHOLD = 245  # for RGB images: channels all above this = background

# ─── MOCKUP CONFIG ───────────────────────────────────────────────────────────
SHIRT_COLOR = "white"   # 'white' or 'black'
SHIRT_SIDE  = "front"   # 'front' or 'back'

# Override mockup image path (None = auto: tools/mockups/<color>_<side>.png)
MOCKUP_IMAGE_PATH = "/Volumes/My Passport/Personal_Project/PimSuea/tools/test_data/front_white_mock_template.png"

# Mockup canvas size and print-area placement (pixels)
_MOCKUP_W = 752
_MOCKUP_H = 829
_PLACEMENTS = {
    "front": {"x": 242, "y": 267, "w": 263, "h": 350},
    "back":  {"x": 242, "y": 191, "w": 263, "h": 350},
}

# Collar positions in each mockup image (px from the top of the image)
COLLAR_Y = {"front": 223, "back": 144}
# Fixed real-world distance from collar to the top of the print area
COLLAR_TO_PRINT_AREA_IN = 3.0

# Visual style (applied at preview scale)
ORANGE      = (255, 107, 53, 255)   # dimension measurement lines + labels
BLUE_MUTED  = (100, 149, 237, 220)  # element bounding box (visually behind)
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


def get_print_tier(w_in: float, h_in: float) -> str:
    """Mirror of getPrintTier in backend/src/utils/pricing.js."""
    short, long_ = sorted([w_in, h_in])
    # Custom inch-based tiers: 3x4in, A5=6x8in, A4=8x12in, A3=12x16in (catch-all)
    if short <= 3.0 and long_ <= 4.0:  return "3x4in"
    if short <= 6.0 and long_ <= 8.0:  return "A5"
    if short <= 8.0 and long_ <= 12.0: return "A4"
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
    """Draw bold black text centered at (cx, cy), no background."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2), text, fill=(0, 0, 0, 255), font=font)


def composite_on_mockup(
    print_img: Image.Image,
    mockup_path: str,
    placement: dict,
    output_path: Path,
    measurements: dict,
) -> None:
    """Paste the print file onto the shirt mockup and draw annotations at mockup resolution.

    Annotations are drawn directly on the mockup image so text is always crisp,
    regardless of how small the placement area is.

    measurements keys: x_min, y_min, x_max, y_max, center_x (all in full-res pixels),
                       y_label, x_label, size_text
    """
    mp = Path(mockup_path)
    if not mp.exists():
        print(f"  [mockup] Not found: {mockup_path} — skipping mockup output.")
        return

    px_off, py_off = placement["x"], placement["y"]
    pw, ph = placement["w"], placement["h"]

    # Scale factors: full-res pixel → mockup placement pixel
    sx = pw / print_img.width
    sy = ph / print_img.height

    # 1. Paste print design onto mockup
    mockup = Image.open(mp).convert("RGBA")
    design = print_img.convert("RGBA").resize((pw, ph), Image.LANCZOS)
    mockup.paste(design, (px_off, py_off), mask=design)

    # 2. Draw annotations directly on the mockup at its native resolution
    draw = ImageDraw.Draw(mockup)

    # Bounding box in mockup coordinates
    bx0 = px_off + int(measurements["x_min"] * sx)
    by0 = py_off + int(measurements["y_min"] * sy)
    bx1 = px_off + int(measurements["x_max"] * sx)
    by1 = py_off + int(measurements["y_max"] * sy)

    font = None
    for path, idx in [
        ("/System/Library/Fonts/Helvetica.ttc", 1),   # Helvetica Bold
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
        ("/Library/Fonts/Arial Bold.ttf", 0),
        ("/System/Library/Fonts/Helvetica.ttc", 0),   # fallback: regular
    ]:
        try:
            font = ImageFont.truetype(path, FONT_SIZE, index=idx)
            break
        except Exception:
            continue
    if font is None:
        font = ImageFont.load_default()

    # Derived positions
    collar_x   = px_off + pw // 2          # print-area centre X = shirt centre X
    collar_y   = measurements["collar_y"]  # top of Y arrow (collar in mockup px)
    elem_top_y = by0                       # bottom of Y arrow / start of X arrow

    # Print area border (light grey reference rect)
    draw.rectangle([px_off, py_off, px_off + pw - 1, py_off + ph - 1],
                   outline=(180, 180, 180), width=1)

    # Dotted bounding box around element (blue — visually behind orange dimension lines)
    for (ax, ay, bx_, by_) in [
        (bx0, by0, bx1, by0), (bx1, by0, bx1, by1),
        (bx1, by1, bx0, by1), (bx0, by1, bx0, by0),
    ]:
        draw_dashed_line(draw, ax, ay, bx_, by_, color=BLUE_MUTED)

    # ── Y measurement: solid vertical line from collar → element top ─────────
    draw.line([(collar_x, collar_y), (collar_x, elem_top_y)], fill=ORANGE, width=LINE_W)
    draw.line([(collar_x - TICK, collar_y),    (collar_x + TICK, collar_y)],    fill=ORANGE, width=LINE_W)
    draw.line([(collar_x - TICK, elem_top_y),  (collar_x + TICK, elem_top_y)],  fill=ORANGE, width=LINE_W)
    y_total_label = f"{measurements['collar_to_elem_in']:.2f} in"
    # Y label: hugs the collar tick from below, left side — always above X label
    draw_label(draw, y_total_label, collar_x - TICK - 30, collar_y + FONT_SIZE // 2 + 4, font)

    # ── X measurement: dashed horizontal line from collar_x → element left ───
    x_dir = measurements["x_dir"]
    if x_dir != "centered":
        draw_dashed_line(draw, collar_x, elem_top_y, bx0, elem_top_y, color=ORANGE)
        draw.line([(collar_x, elem_top_y - TICK), (collar_x, elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
        draw.line([(bx0,      elem_top_y - TICK), (bx0,      elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
        x_label_text = f"{measurements['x_offset_in']:.2f} in {x_dir}"
        mid_h = (collar_x + bx0) // 2
        # X label: hugs the element-top tick from above — always below Y label
        draw_label(draw, x_label_text, mid_h, elem_top_y - FONT_SIZE // 2 - 4, font)
    else:
        draw_label(draw, "centered", collar_x - TICK - 30, elem_top_y - FONT_SIZE // 2 - 4, font)

    # ── Size + tier label below element ──────────────────────────────────────
    draw_label(draw, measurements["size_text"], (bx0 + bx1) // 2,
               by1 + PAD + FONT_SIZE // 2, font)

    mockup.convert("RGB").save(output_path)
    print(f"  Mockup  → {output_path}\n")


def annotate(input_path: str, output_path: str | None = None):
    is_url = input_path.startswith("http://") or input_path.startswith("https://")

    if is_url:
        url_name = Path(urllib.parse.urlparse(input_path).path).stem or "print"
        with urllib.request.urlopen(input_path) as resp:
            img_full = Image.open(BytesIO(resp.read())).convert("RGBA")
        src = Path(output_path).parent if output_path else Path(".")
        out = Path(output_path) if output_path else src / (url_name + "_annotated.png")
        mockup_src_stem = url_name
    else:
        src = Path(input_path)
        if not src.exists():
            raise FileNotFoundError(f"Not found: {input_path}")
        out = Path(output_path) if output_path else src.with_stem(src.stem + "_annotated")
        img_full = Image.open(src).convert("RGBA")
        mockup_src_stem = src.stem
    W, H = img_full.size
    px_to_in = PHYSICAL_W_IN / W          # inches per pixel (full resolution)
    center_x = W / 2

    x_min, y_min, x_max, y_max = find_content_bbox(img_full)

    elem_w_in   = (x_max - x_min) * px_to_in
    elem_h_in   = (y_max - y_min) * px_to_in
    y_in        = y_min * px_to_in
    x_offset_in = abs(x_min - center_x) * px_to_in
    x_dir       = ("right" if x_min > center_x + 1
                   else "left" if x_min < center_x - 1
                   else "centered")
    tier        = get_print_tier(elem_w_in, elem_h_in)

    # ── Console summary ──────────────────────────────────────────────────────
    print(f"\n{'─'*48}")
    print(f"  File       : {src.name}")
    print(f"  Image size : {W} × {H} px  ({PHYSICAL_W_IN} × {PHYSICAL_H_IN:.2f} in)")
    print(f"  1 px       = {px_to_in:.6f} in")
    print(f"{'─'*48}")
    print(f"  Element    : {elem_w_in:.2f}\" × {elem_h_in:.2f}\"  [{tier}]")
    print(f"  Y from top : {y_in:.2f} in")
    print(f"  X offset   : {x_offset_in:.2f} in {'' if x_dir == 'centered' else x_dir}")
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

    font = None
    for path, idx in [
        ("/System/Library/Fonts/Helvetica.ttc", 1),   # Helvetica Bold
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
        ("/Library/Fonts/Arial Bold.ttf", 0),
        ("/System/Library/Fonts/Helvetica.ttc", 0),   # fallback: regular
    ]:
        try:
            font = ImageFont.truetype(path, FONT_SIZE, index=idx)
            break
        except Exception:
            continue
    if font is None:
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
    y_label = "0.00 in from top" if y_in < 0.005 else f"{y_in:.2f} in from top"
    draw_label(draw, y_label, MARGIN_LEFT // 2, mid_y, font)

    # 3. X offset — horizontal line in top margin, from area center-x to element left edge
    hy = MARGIN_TOP // 2
    draw_dashed_line(draw, cx_s, hy, bx0, hy, color=ORANGE)
    draw.line([(cx_s, hy - TICK), (cx_s, hy + TICK)], fill=ORANGE, width=LINE_W)
    draw.line([(bx0,  hy - TICK), (bx0,  hy + TICK)], fill=ORANGE, width=LINE_W)
    # Vertical connector from top margin line down to element's top-left corner
    draw_dashed_line(draw, bx0, hy, bx0, by0, color=ORANGE)
    x_label = ("centered" if x_dir == "centered"
               else f"{x_offset_in:.2f} in {x_dir}")
    draw_label(draw, x_label, (cx_s + bx0) // 2, hy // 2 + 4, font)

    # 4. Size + tier label below the bounding box
    size_text = f"{elem_w_in:.2f}\" × {elem_h_in:.2f}\"  [{tier}]"
    draw_label(draw, size_text, (bx0 + bx1) // 2, by1 + PAD + FONT_SIZE // 2, font)

    canvas.save(out)
    print(f"  Annotated → {out}")

    # ── Mockup composite ────────────────────────────────────────────────────
    mockup_path = MOCKUP_IMAGE_PATH or str(
        Path(__file__).parent / "mockups" / f"{SHIRT_COLOR}_{SHIRT_SIDE}.png"
    )
    placement = _PLACEMENTS[SHIRT_SIDE]
    mockup_out = out.with_stem(mockup_src_stem + f"_mockup_{SHIRT_SIDE}")
    measurements = {
        "x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max,
        "center_x": center_x,
        "y_label": y_label,
        "x_label": x_label,
        "size_text": size_text,
        "collar_y": COLLAR_Y.get(SHIRT_SIDE, 223),
        "collar_to_elem_in": COLLAR_TO_PRINT_AREA_IN + y_in,
        "x_dir": x_dir,
        "x_offset_in": x_offset_in,
    }
    composite_on_mockup(img_full, mockup_path, placement, mockup_out, measurements)


if __name__ == "__main__":
    annotate(INPUT_PATH, OUTPUT_PATH)
