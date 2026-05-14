"""
Tip_annotate.py — Admin tool for annotating print files with measurements
                  and compositing them onto shirt mockups. (Tip brand variant)

Differences from annotate_print.py:
  - X measurement goes from shirt center to the NEAREST EDGE of the design
    (right edge if design is left of center; left edge if right of center).
  - All measurements are shown in Thai units: X นิ้ว Y กระเบียด
    (1 กระเบียด = 0.25 inch, rounded to nearest 0.25). No cm suffix.

Usage:
  1. Set INPUT_PATH to your 300 DPI print PNG.
  2. Set SHIRT_COLOR ('white' or 'black') and SHIRT_SIDE ('front' or 'back').
  3. Place mockup images in tools/mockups/ as white_front.png, black_back.png, etc.
     (or set MOCKUP_IMAGE_PATH directly to override).
  4. Run:  python tools/Tip_annotate.py
  5. Outputs:
       <input>_annotated.png   — dotted-line overlays + measurement labels
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
INPUT_PATH    = "/Volumes/My Passport/Personal_Project/PimSuea/tools/test_data/IBC_front_printfile_2.png"   # ← set this
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
_MOCKUP_W = 2048
_MOCKUP_H = 1742
_PLACEMENTS = {
    "front": {"x": 668, "y": 431, "w": 716, "h": 955},
    "back":  {"x": 668, "y": 287, "w": 716, "h": 955},
}

# Back side only: leftmost pixel of the shirt body in the back mockup image.
# Used as the reference point for horizontal offset (instead of shirt center).
BACK_SHIRT_LEFT_PX = 420

# Collar positions in each mockup image (px from the top of the image)
COLLAR_Y = {"front": 252, "back": 108}
# Fixed real-world distance from collar to the top of the print area
COLLAR_TO_PRINT_AREA_IN = 3.0

# ─── LOGO TAG CONFIG ──────────────────────────────────────────────────────────
SHOW_TAG           = False
TAG_IMAGE_PATH     = "/Volumes/My Passport/Personal_Project/PimSuea/tools/templates/Tag.png"
TAG_PHYS_W_IN      = 1.5
TAG_SRC_W, TAG_SRC_H = 2400, 1212
TAG_COLLAR_Y_FRONT = 104
TAG_OFFSET_IN      = 0.5
# ─────────────────────────────────────────────────────────────────────────────

# Visual style (applied at preview scale)
ORANGE      = (255, 107, 53, 255)
BLUE_MUTED  = (100, 149, 237, 220)
DARK_BG     = (0, 0, 0, 165)
WHITE       = (255, 255, 255, 255)
DASH_LEN    = 12
GAP_LEN     = 7
LINE_W      = 2
FONT_SIZE   = 22
PAD         = 14
TICK        = 8
PREVIEW_DIV = 6
MARGIN_LEFT = 150
MARGIN_TOP  = 60
SIDE_PAD_LEFT      = 30
SIDE_PPI           = 55
SIDE_MIN_PX        = 60
SIDE_MARGIN_RIGHT  = 180
SIDE_MARGIN_BOTTOM = 50

# ─── COMBINE CONFIG ──────────────────────────────────────────────────────────
COMBINE_PATHS  = []
COMBINE_OUTPUT = None
COMBINE_GAP    = 20

# ─── BATCH CONFIG ────────────────────────────────────────────────────────────
BATCH_SIDES = [
   {"input":"/Volumes/My Passport/Personal_Project/PimSuea/tools/real_data/Print_file_TU_shirt.png", "mockup": "/Volumes/My Passport/Personal_Project/PimSuea/tools/templates/merch_white_front.JPG", "side": "front", "show_tag": False},
    # {"input":"/Volumes/My Passport/Personal_Project/PimSuea/tools/real_data/IBC_Back.png", "mockup": "/Volumes/My Passport/Personal_Project/PimSuea/tools/templates/merch_white_back.JPG", "side": "back", "show_tag": False}
]
BATCH_OUTPUT = None
# ─────────────────────────────────────────────────────────────────────────────


def get_print_tier(w_in: float, h_in: float) -> str:
    """Mirror of getPrintTier in backend/src/utils/pricing.js."""
    short, long_ = sorted([w_in, h_in])
    if short <= 3.0 and long_ <= 4.0:  return "3x4in"
    if short <= 6.0 and long_ <= 8.0:  return "A5"
    if short <= 8.0 and long_ <= 12.0: return "A4"
    return "A3"


def format_krabiad(inches: float) -> str:
    """Format inches as Thai 'X นิ้ว Y กระเบียด' (1 กระเบียด = 0.25 in, rounded)."""
    rounded = round(inches * 4) / 4
    whole = int(rounded)
    krab  = round((rounded - whole) / 0.25)
    if krab == 0:
        return f"{whole} in"
    if whole == 0:
        return f"{krab} กระเบียด"
    return f"{whole} in {krab} กระเบียด"


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


def draw_dimension_bracket(draw, x1, y1, x2, y2, label, font, orientation, color=ORANGE):
    """Draw a dimension bracket with tick marks and a centered label.

    orientation: 'horizontal' — horizontal line, vertical ticks, label below
                 'vertical'   — vertical line, horizontal ticks, label to the right
    """
    draw.line([(x1, y1), (x2, y2)], fill=color, width=LINE_W)
    if orientation == 'horizontal':
        draw.line([(x1, y1 - TICK), (x1, y1 + TICK)], fill=color, width=LINE_W)
        draw.line([(x2, y2 - TICK), (x2, y2 + TICK)], fill=color, width=LINE_W)
        draw_label(draw, label, (x1 + x2) // 2, y1 + PAD + FONT_SIZE // 2, font)
    else:  # vertical
        draw.line([(x1 - TICK, y1), (x1 + TICK, y1)], fill=color, width=LINE_W)
        draw.line([(x2 - TICK, y2), (x2 + TICK, y2)], fill=color, width=LINE_W)
        draw_label(draw, label, x1 + PAD + FONT_SIZE // 2, (y1 + y2) // 2, font)


def composite_on_mockup(
    print_img: Image.Image,
    mockup_path: str,
    placement: dict,
    output_path: Path,
    measurements: dict,
    side: str = "front",
    show_tag: bool = True,
) -> None:
    """Paste the print file onto the shirt mockup and draw annotations at mockup resolution."""
    mp = Path(mockup_path)
    if not mp.exists():
        print(f"  [mockup] Not found: {mockup_path} — skipping mockup output.")
        return

    px_off, py_off = placement["x"], placement["y"]
    pw, ph = placement["w"], placement["h"]

    sx = pw / print_img.width
    sy = ph / print_img.height

    # 1. Paste print design onto mockup
    mockup = Image.open(mp).convert("RGBA")
    design = print_img.convert("RGBA").resize((pw, ph), Image.LANCZOS)
    mockup.paste(design, (px_off, py_off), mask=design)

    # 1b. Logo tag overlay (front only)
    _tag_info = None
    if show_tag and side == "front":
        px_per_in = pw / PHYSICAL_W_IN
        tag_w_px  = round(TAG_PHYS_W_IN * px_per_in)
        tag_h_px  = round(tag_w_px * TAG_SRC_H / TAG_SRC_W)
        tag_x     = px_off + pw // 2 - tag_w_px // 2
        tag_y     = TAG_COLLAR_Y_FRONT + round(TAG_OFFSET_IN * px_per_in)
        _tag_info = (tag_x, tag_y, tag_w_px, tag_h_px)
        if TAG_IMAGE_PATH and Path(TAG_IMAGE_PATH).exists():
            tag_src = Image.open(TAG_IMAGE_PATH).convert("RGBA")
            tag_img = tag_src.resize((tag_w_px, tag_h_px), Image.LANCZOS)
            mockup.paste(tag_img, (tag_x, tag_y), mask=tag_img)

    # 2. Draw annotations directly on the mockup at its native resolution
    draw = ImageDraw.Draw(mockup)

    # Bounding box in mockup coordinates
    bx0 = px_off + int(measurements["x_min"] * sx)
    by0 = py_off + int(measurements["y_min"] * sy)
    bx1 = px_off + int(measurements["x_max"] * sx)
    by1 = py_off + int(measurements["y_max"] * sy)

    # Nearest X edge in mockup coordinates
    nearest_x_px = px_off + int(measurements["nearest_x"] * sx)

    font = None
    for path, idx in [
        ("/Users/ktap8/Library/Fonts/THSarabunNew Bold.ttf", 0),    # Thai + Latin bold
        ("/System/Library/Fonts/Supplemental/SukhumvitSet.ttc", 0), # system Thai fallback
        ("/System/Library/Fonts/Supplemental/Thonburi.ttc", 0),     # system Thai fallback
        ("/System/Library/Fonts/Helvetica.ttc", 1),                 # Latin-only last resort
    ]:
        try:
            font = ImageFont.truetype(path, FONT_SIZE, index=idx)
            break
        except Exception:
            continue
    if font is None:
        font = ImageFont.load_default()

    collar_x   = px_off + pw // 2
    collar_y   = measurements["collar_y"]
    elem_top_y = by0

    # Print area border
    draw.rectangle([px_off, py_off, px_off + pw - 1, py_off + ph - 1],
                   outline=(180, 180, 180), width=1)

    # Dotted bounding box (blue)
    for (ax, ay, bx_, by_) in [
        (bx0, by0, bx1, by0), (bx1, by0, bx1, by1),
        (bx1, by1, bx0, by1), (bx0, by1, bx0, by0),
    ]:
        draw_dashed_line(draw, ax, ay, bx_, by_, color=BLUE_MUTED)

    # ── Y measurement: solid vertical line from collar → element top ─────────
    draw.line([(collar_x, collar_y), (collar_x, elem_top_y)], fill=ORANGE, width=LINE_W)
    draw.line([(collar_x - TICK, collar_y),    (collar_x + TICK, collar_y)],    fill=ORANGE, width=LINE_W)
    draw.line([(collar_x - TICK, elem_top_y),  (collar_x + TICK, elem_top_y)],  fill=ORANGE, width=LINE_W)
    y_total_label = format_krabiad(measurements['collar_to_elem_in'])
    draw_label(draw, y_total_label, collar_x - TICK - 30, collar_y + FONT_SIZE // 2 + 4, font)

    # ── X measurement: shirt center → nearest edge of design (front and back) ──
    x_dir = measurements["x_dir"]
    if x_dir != "centered":
        draw_dashed_line(draw, collar_x, elem_top_y, nearest_x_px, elem_top_y, color=ORANGE)
        draw.line([(collar_x,     elem_top_y - TICK), (collar_x,     elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
        draw.line([(nearest_x_px, elem_top_y - TICK), (nearest_x_px, elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
        x_label_text = f"{format_krabiad(measurements['x_offset_in'])} {x_dir}"
        mid_h = (collar_x + nearest_x_px) // 2
        draw_label(draw, x_label_text, mid_h, elem_top_y - FONT_SIZE // 2 - 4, font)
    else:
        draw_label(draw, "centered", collar_x - TICK - 30, elem_top_y - FONT_SIZE // 2 - 4, font)

    # ── Tag annotations (front only) ─────────────────────────────────────────
    if _tag_info is not None:
        tx, ty, tw, th = _tag_info
        for (ax, ay, bx_, by_) in [
            (tx,      ty,      tx + tw, ty     ),
            (tx + tw, ty,      tx + tw, ty + th),
            (tx + tw, ty + th, tx,      ty + th),
            (tx,      ty + th, tx,      ty     ),
        ]:
            draw_dashed_line(draw, ax, ay, bx_, by_, color=BLUE_MUTED)
        tag_line_x = collar_x + TICK + 4
        draw.line([(tag_line_x, TAG_COLLAR_Y_FRONT), (tag_line_x, ty)], fill=ORANGE, width=LINE_W)
        draw.line([(tag_line_x - TICK, TAG_COLLAR_Y_FRONT), (tag_line_x + TICK, TAG_COLLAR_Y_FRONT)], fill=ORANGE, width=LINE_W)
        draw.line([(tag_line_x - TICK, ty),                 (tag_line_x + TICK, ty)],                 fill=ORANGE, width=LINE_W)
        tag_y_label = format_krabiad(TAG_OFFSET_IN)
        draw_label(draw, tag_y_label, tag_line_x + TICK + 35, (TAG_COLLAR_Y_FRONT + ty) // 2, font)
        draw_label(draw, "centered", tx + tw // 2, ty + th + FONT_SIZE // 2 + 4, font)

    # ── Side panel ───────────────────────────────────────────────────────────
    elem_crop = print_img.crop((
        measurements["x_min"], measurements["y_min"],
        measurements["x_max"], measurements["y_max"]
    )).convert("RGBA")

    side_gw_raw = measurements['elem_w_in'] * SIDE_PPI
    side_gh_raw = measurements['elem_h_in'] * SIDE_PPI

    tag_panel_img  = None
    tag_panel_w    = tag_panel_h = 0
    tag_panel_w_in = tag_panel_h_in = 0.0
    tag_panel_w_raw = tag_panel_h_raw = 0.0
    if side == "front" and _tag_info is not None:
        tag_panel_w_in  = TAG_PHYS_W_IN
        tag_panel_h_in  = TAG_PHYS_W_IN * TAG_SRC_H / TAG_SRC_W
        tag_panel_w_raw = tag_panel_w_in * SIDE_PPI
        tag_panel_h_raw = tag_panel_h_in * SIDE_PPI

    all_dims = [side_gw_raw, side_gh_raw]
    if tag_panel_w_raw:
        all_dims += [tag_panel_w_raw, tag_panel_h_raw]
    min_dim  = min(all_dims)
    scale_up = max(1.0, SIDE_MIN_PX / min_dim)

    side_gw  = round(side_gw_raw  * scale_up)
    side_gh  = round(side_gh_raw  * scale_up)
    side_img = elem_crop.resize((side_gw, side_gh), Image.LANCZOS)

    if tag_panel_w_raw:
        tag_panel_w = round(tag_panel_w_raw * scale_up)
        tag_panel_h = round(tag_panel_h_raw * scale_up)
        if TAG_IMAGE_PATH and Path(TAG_IMAGE_PATH).exists():
            tag_panel_img = Image.open(TAG_IMAGE_PATH).convert("RGBA") \
                                 .resize((tag_panel_w, tag_panel_h), Image.LANCZOS)
        else:
            tag_panel_img = Image.new("RGBA", (tag_panel_w, tag_panel_h), (210, 210, 210, 200))

    mw, mh    = mockup.width, mockup.height
    col_w     = max(side_gw, tag_panel_w)
    tag_gap   = SIDE_MARGIN_BOTTOM

    side_content_h = side_gh
    if tag_panel_img is not None:
        side_content_h += tag_gap + tag_panel_h + SIDE_MARGIN_BOTTOM

    sg_x  = mw + SIDE_PAD_LEFT
    sg_y  = max(0, (mh - side_content_h) // 2)

    elem_x = sg_x + (col_w - side_gw) // 2
    tag_x = sg_x + (col_w - tag_panel_w) // 2 if tag_panel_img else 0
    tag_y = sg_y + side_gh + tag_gap            if tag_panel_img else 0

    new_w = mw + SIDE_PAD_LEFT + col_w + SIDE_MARGIN_RIGHT
    new_h = max(mh, sg_y + side_content_h + SIDE_MARGIN_BOTTOM)

    expanded = Image.new("RGBA", (new_w, new_h), (255, 255, 255, 255))
    expanded.paste(mockup.convert("RGBA"), (0, 0))
    expanded.paste(side_img, (elem_x, sg_y), mask=side_img)
    if tag_panel_img is not None:
        expanded.paste(tag_panel_img, (tag_x, tag_y), mask=tag_panel_img)

    draw2 = ImageDraw.Draw(expanded)

    w_label = f"{format_krabiad(measurements['elem_w_in'])}  [{measurements['tier']}]"
    h_label = format_krabiad(measurements['elem_h_in'])
    draw_dimension_bracket(draw2, elem_x, sg_y + side_gh + PAD,
                           elem_x + side_gw, sg_y + side_gh + PAD,
                           w_label, font, 'horizontal')
    draw_dimension_bracket(draw2, elem_x + side_gw + PAD, sg_y,
                           elem_x + side_gw + PAD, sg_y + side_gh,
                           h_label, font, 'vertical')

    if tag_panel_img is not None:
        tw_label = format_krabiad(tag_panel_w_in)
        th_label = format_krabiad(tag_panel_h_in)
        draw_dimension_bracket(draw2, tag_x, tag_y + tag_panel_h + PAD,
                               tag_x + tag_panel_w, tag_y + tag_panel_h + PAD,
                               tw_label, font, 'horizontal')
        draw_dimension_bracket(draw2, tag_x + tag_panel_w + PAD, tag_y,
                               tag_x + tag_panel_w + PAD, tag_y + tag_panel_h,
                               th_label, font, 'vertical')

    expanded.convert("RGB").save(output_path)
    print(f"  Mockup  → {output_path}\n")


def annotate(input_path: str, output_path: str | None = None, *,
             shirt_side: str | None = None,
             mockup_image_path: str | None = None,
             show_tag: bool | None = None) -> Path | None:
    _side       = shirt_side        if shirt_side        is not None else SHIRT_SIDE
    _mockup_img = mockup_image_path if mockup_image_path is not None else MOCKUP_IMAGE_PATH
    _show_tag   = show_tag          if show_tag          is not None else SHOW_TAG

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
    px_to_in = PHYSICAL_W_IN / W
    center_x = W / 2

    x_min, y_min, x_max, y_max = find_content_bbox(img_full)

    elem_w_in = (x_max - x_min) * px_to_in
    elem_h_in = (y_max - y_min) * px_to_in
    y_in      = y_min * px_to_in
    tier      = get_print_tier(elem_w_in, elem_h_in)

    # ── X direction: based on design center vs shirt center ──────────────────
    design_cx = (x_min + x_max) / 2
    if design_cx > center_x + 1:
        x_dir       = "right"
        nearest_x   = x_min                             # nearest edge is left side of design
        x_offset_in = (x_min - center_x) * px_to_in
    elif design_cx < center_x - 1:
        x_dir       = "left"
        nearest_x   = x_max                             # nearest edge is right side of design
        x_offset_in = (center_x - x_max) * px_to_in
    else:
        x_dir       = "centered"
        nearest_x   = center_x
        x_offset_in = 0.0

    # ── Console summary ──────────────────────────────────────────────────────
    print(f"\n{'─'*48}")
    print(f"  File       : {src.name}")
    print(f"  Image size : {W} × {H} px  ({PHYSICAL_W_IN} × {PHYSICAL_H_IN:.2f} in)")
    print(f"  1 px       = {px_to_in:.6f} in")
    print(f"{'─'*48}")
    print(f"  Element    : {elem_w_in:.2f}\" × {elem_h_in:.2f}\"  [{tier}]")
    print(f"  Y from top : {y_in:.2f} in  ({format_krabiad(y_in)})")
    print(f"  X offset   : {x_offset_in:.2f} in  ({format_krabiad(x_offset_in)}) {'' if x_dir == 'centered' else x_dir}")
    print(f"{'─'*48}\n")

    # ── Build preview canvas at 1/PREVIEW_DIV scale ──────────────────────────
    scale = 1 / PREVIEW_DIV
    pw, ph = max(1, int(W * scale)), max(1, int(H * scale))

    thumb = img_full.resize((pw, ph), Image.LANCZOS).convert("RGBA")

    total_w = pw + MARGIN_LEFT
    total_h = ph + MARGIN_TOP
    canvas = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    canvas.paste(thumb, (MARGIN_LEFT, MARGIN_TOP), mask=thumb)

    draw = ImageDraw.Draw(canvas)

    def s(v): return int(v * scale)
    ox, oy = MARGIN_LEFT, MARGIN_TOP

    bx0, by0 = ox + s(x_min), oy + s(y_min)
    bx1, by1 = ox + s(x_max), oy + s(y_max)
    cx_s  = ox + s(center_x)
    nx_s  = ox + s(nearest_x)   # nearest edge in preview coords
    img_top = oy

    font = None
    for path, idx in [
        ("/Users/ktap8/Library/Fonts/THSarabunNew Bold.ttf", 0),    # Thai + Latin bold
        ("/System/Library/Fonts/Supplemental/SukhumvitSet.ttc", 0), # system Thai fallback
        ("/System/Library/Fonts/Supplemental/Thonburi.ttc", 0),     # system Thai fallback
        ("/System/Library/Fonts/Helvetica.ttc", 1),                 # Latin-only last resort
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
    draw_dashed_line(draw, vx, by0, bx0, by0, color=ORANGE)
    mid_y = (img_top + by0) // 2
    y_label = "0 นิ้ว จากบน" if y_in < 0.005 else f"{format_krabiad(y_in)} จากบน"
    draw_label(draw, y_label, MARGIN_LEFT // 2, mid_y, font)

    # 3. X offset: shirt center → nearest edge of design (front and back)
    hy = MARGIN_TOP // 2
    draw_dashed_line(draw, cx_s, hy, nx_s, hy, color=ORANGE)
    draw.line([(cx_s, hy - TICK), (cx_s, hy + TICK)], fill=ORANGE, width=LINE_W)
    draw.line([(nx_s, hy - TICK), (nx_s, hy + TICK)], fill=ORANGE, width=LINE_W)
    draw_dashed_line(draw, nx_s, hy, nx_s, by0, color=ORANGE)
    x_label = ("centered" if x_dir == "centered"
               else f"{format_krabiad(x_offset_in)} {x_dir}")
    draw_label(draw, x_label, (cx_s + nx_s) // 2, hy // 2 + 4, font)

    # 4. Size + tier label below the bounding box
    size_text = f"{format_krabiad(elem_w_in)} × {format_krabiad(elem_h_in)}  [{tier}]"
    draw_label(draw, size_text, (bx0 + bx1) // 2, by1 + PAD + FONT_SIZE // 2, font)

    canvas.save(out)
    print(f"  Annotated → {out}")

    # ── Mockup composite ────────────────────────────────────────────────────
    mockup_path = _mockup_img or str(
        Path(__file__).parent / "mockups" / f"{SHIRT_COLOR}_{_side}.png"
    )
    placement = _PLACEMENTS[_side]
    mockup_out = out.with_stem(mockup_src_stem + f"_mockup_{_side}")
    measurements = {
        "x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max,
        "center_x": center_x,
        "nearest_x": nearest_x,
        "y_label": y_label,
        "x_label": x_label,
        "elem_w_in": elem_w_in,
        "elem_h_in": elem_h_in,
        "tier": tier,
        "collar_y": COLLAR_Y.get(_side, 223),
        "collar_to_elem_in": COLLAR_TO_PRINT_AREA_IN + y_in,
        "x_dir": x_dir,
        "x_offset_in": x_offset_in,
    }
    composite_on_mockup(img_full, mockup_path, placement, mockup_out, measurements, side=_side, show_tag=_show_tag)
    return mockup_out


def combine_mockups(paths, output_path=None, gap=COMBINE_GAP):
    """Combine multiple mockup images into a two-column grid."""
    if not paths:
        raise ValueError("combine_mockups: paths list is empty.")
    images = [Image.open(p).convert("RGB") for p in paths]

    split_x = _MOCKUP_W
    shirts = [img.crop((0, 0, min(split_x, img.width), img.height)) for img in images]
    panels = [img.crop((min(split_x, img.width), 0, img.width, img.height)) for img in images]

    shirt_col_w = max(s.width for s in shirts)
    panel_col_w = max(p.width for p in panels)
    row_heights  = [img.height for img in images]
    total_w = shirt_col_w + gap + panel_col_w
    total_h = sum(row_heights) + gap * (len(images) - 1)

    combined = Image.new("RGB", (total_w, total_h), (255, 255, 255))
    y = 0
    for shirt, panel, row_h in zip(shirts, panels, row_heights):
        combined.paste(shirt, (0, y))
        combined.paste(panel, (shirt_col_w + gap, y))
        y += row_h + gap

    if output_path is None:
        first = Path(paths[0])
        output_path = first.with_stem(first.stem + "_combined")
    combined.save(output_path)
    print(f"  Combined → {output_path}")


def run_batch(sides, output_path=None):
    """Full pipeline: annotate each side, then combine into one image."""
    mockup_paths = []
    for entry in sides:
        mockup_out = annotate(
            entry["input"],
            shirt_side=entry["side"],
            mockup_image_path=entry["mockup"],
            show_tag=entry.get("show_tag"),
        )
        if mockup_out:
            mockup_paths.append(mockup_out)

    if mockup_paths:
        if output_path is None:
            first = Path(sides[0]["input"])
            output_path = first.with_stem(first.stem + "_combined")
        combine_mockups([str(p) for p in mockup_paths], output_path)


if __name__ == "__main__":
    if BATCH_SIDES:
        run_batch(BATCH_SIDES, BATCH_OUTPUT)
    elif COMBINE_PATHS:
        combine_mockups(COMBINE_PATHS, COMBINE_OUTPUT)
    else:
        annotate(INPUT_PATH, OUTPUT_PATH)
