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
INPUT_PATH    = "/Volumes/My Passport/Personal_Project/PimSuea/tools/test_data/IBC_front_printfile_2.png"   # ← set this
OUTPUT_PATH   = None                        # None = auto: <input>_annotated.png
PHYSICAL_W_IN = 12.0                        # inches
PHYSICAL_H_IN = 16.0                        # inches

LABEL_DECIMALS = 2  # decimal places for all measurement labels (1 = "3.1 in", 2 = "3.07 in")

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
# Woven/printed brand tag overlaid on the front collar of every mockup.
# Set TAG_IMAGE_PATH to your tag PNG; set to None to skip.
# Set SHOW_TAG = False to omit the tag without changing TAG_IMAGE_PATH.
SHOW_TAG           = False                      # ← toggle tag on/off globally
TAG_IMAGE_PATH     = "/Volumes/My Passport/Personal_Project/PimSuea/tools/templates/Tag.png"                   # e.g. "tools/assets/tag.png"
TAG_PHYS_W_IN      = 1.5                   # physical width of the tag (inches)
TAG_SRC_W, TAG_SRC_H = 2400, 1212            # source image px — gives aspect ratio
TAG_COLLAR_Y_FRONT = 104                   # px from top of front mockup where collar sits
TAG_OFFSET_IN      = 0.5                   # inches below collar to place tag top edge
# ─────────────────────────────────────────────────────────────────────────────

# Visual style (applied at preview scale)
ORANGE      = (255, 107, 53, 255)   # dimension measurement lines + labels
BLUE_MUTED  = (100, 149, 237, 220)  # element bounding box (visually behind)
DARK_BG     = (0, 0, 0, 165)
WHITE       = (255, 255, 255, 255)
DASH_LEN    = 12
GAP_LEN     = 7
LINE_W      = 2
FONT_SIZE   = 22
PAD         = 14        # spacing between annotation lines and the bounding box
TICK        = 8         # tick mark half-length
PREVIEW_DIV = 6         # downscale divisor: 3600/6 = 600px wide preview
MARGIN_LEFT = 150       # left margin reserved for Y measurement line + label
MARGIN_TOP  = 60        # top margin reserved for X offset line + label
SIDE_PAD_LEFT      = 30   # gap between mockup right edge and side graphic
SIDE_PPI           = 55   # display scale for side graphic (px per inch) — keeps all graphics proportional
SIDE_MIN_PX        = 60   # minimum side graphic dimension in px (prevents tiny logos being unreadable)
SIDE_MARGIN_RIGHT  = 180  # room for height bracket + label to the right
SIDE_MARGIN_BOTTOM = 50   # room for width bracket + label below

# ─── COMBINE CONFIG ──────────────────────────────────────────────────────────
# Set COMBINE_PATHS to a list of mockup image paths to stitch them side-by-side.
# Leave empty ([]) to run the normal annotate+mockup workflow instead.
COMBINE_PATHS  = []          # e.g. ["..._mockup_front.png", "..._mockup_back.png"]
COMBINE_OUTPUT = None        # None = auto: <first_stem>_combined.png
COMBINE_GAP    = 20          # horizontal gap between images in pixels

# ─── BATCH CONFIG ────────────────────────────────────────────────────────────
# One-shot pipeline: annotate each side, then combine into a single image.
# Set BATCH_SIDES to a list of dicts; leave empty ([]) to use single-file mode.
BATCH_SIDES = [
    {"input":"/Volumes/My Passport/Personal_Project/PimSuea/tools/real_data/Jett_front.png", "mockup": "/Volumes/My Passport/Personal_Project/PimSuea/tools/templates/merch_white_front.JPG", "side": "front", "show_tag": False},
    {"input":"/Volumes/My Passport/Personal_Project/PimSuea/tools/real_data/Jett_back.png", "mockup": "/Volumes/My Passport/Personal_Project/PimSuea/tools/templates/merch_white_back.JPG", "side": "back", "show_tag": False}
    # {"input": "...front_print.png", "mockup": "...front_template.png", "side": "front"},
    # {"input": "...back_print.png",  "mockup": "...back_template.png",  "side": "back"},
]
BATCH_OUTPUT = None          # None = auto: <first_input_stem>_combined.png
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
    """Paste the print file onto the shirt mockup and draw annotations at mockup resolution.

    Annotations are drawn directly on the mockup image so text is always crisp,
    regardless of how small the placement area is.

    measurements keys: x_min, y_min, x_max, y_max, center_x (all in full-res pixels),
                       y_label, x_label, elem_w_in, elem_h_in, tier
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

    # 1b. Logo tag overlay (front only) — compute geometry always, paste if image available
    _tag_info = None
    if show_tag and side == "front":
        px_per_in = pw / PHYSICAL_W_IN                          # mockup px per physical inch
        tag_w_px  = round(TAG_PHYS_W_IN * px_per_in)           # e.g. 3.0" → 66 px
        tag_h_px  = round(tag_w_px * TAG_SRC_H / TAG_SRC_W)    # preserve source aspect ratio
        tag_x     = px_off + pw // 2 - tag_w_px // 2           # centred on print area
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
    y_total_label = f"{measurements['collar_to_elem_in']:.{LABEL_DECIMALS}f} in ({measurements['collar_to_elem_in'] * 2.54:.{LABEL_DECIMALS}f} cm)"
    # Y label: hugs the collar tick from below, left side — always above X label
    draw_label(draw, y_total_label, collar_x - TICK - 30, collar_y + FONT_SIZE // 2 + 4, font)

    # ── X measurement ─────────────────────────────────────────────────────────
    x_dir = measurements["x_dir"]
    if side == "back":
        # Back side: measure from shirt left edge to graphic left, or omit if centered.
        if x_dir != "centered":
            shirt_x = BACK_SHIRT_LEFT_PX
            draw_dashed_line(draw, shirt_x, elem_top_y, bx0, elem_top_y, color=ORANGE)
            draw.line([(shirt_x, elem_top_y - TICK), (shirt_x, elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
            draw.line([(bx0,     elem_top_y - TICK), (bx0,     elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
            xfs = measurements["x_from_shirt_in"]
            x_label_text = f"{xfs:.{LABEL_DECIMALS}f} in ({xfs * 2.54:.{LABEL_DECIMALS}f} cm) from shirt left"
            mid_h = (shirt_x + bx0) // 2
            draw_label(draw, x_label_text, mid_h, elem_top_y - FONT_SIZE // 2 - 4, font)
        # else centered → no X annotation
    else:
        # Front / other: measure from shirt center to graphic left edge
        if x_dir != "centered":
            draw_dashed_line(draw, collar_x, elem_top_y, bx0, elem_top_y, color=ORANGE)
            draw.line([(collar_x, elem_top_y - TICK), (collar_x, elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
            draw.line([(bx0,      elem_top_y - TICK), (bx0,      elem_top_y + TICK)], fill=ORANGE, width=LINE_W)
            x_label_text = f"{measurements['x_offset_in']:.{LABEL_DECIMALS}f} in ({measurements['x_offset_in'] * 2.54:.{LABEL_DECIMALS}f} cm) {x_dir}"
            mid_h = (collar_x + bx0) // 2
            draw_label(draw, x_label_text, mid_h, elem_top_y - FONT_SIZE // 2 - 4, font)
        else:
            draw_label(draw, "centered", collar_x - TICK - 30, elem_top_y - FONT_SIZE // 2 - 4, font)

    # ── Tag annotations (front only) ─────────────────────────────────────────
    if _tag_info is not None:
        tx, ty, tw, th = _tag_info
        # Dotted bounding box (blue — same style as print element)
        for (ax, ay, bx_, by_) in [
            (tx,      ty,      tx + tw, ty     ),
            (tx + tw, ty,      tx + tw, ty + th),
            (tx + tw, ty + th, tx,      ty + th),
            (tx,      ty + th, tx,      ty     ),
        ]:
            draw_dashed_line(draw, ax, ay, bx_, by_, color=BLUE_MUTED)
        # Y measurement: collar top → tag top  (drawn right of collar_x to avoid overlap)
        tag_line_x = collar_x + TICK + 4
        draw.line([(tag_line_x, TAG_COLLAR_Y_FRONT), (tag_line_x, ty)], fill=ORANGE, width=LINE_W)
        draw.line([(tag_line_x - TICK, TAG_COLLAR_Y_FRONT), (tag_line_x + TICK, TAG_COLLAR_Y_FRONT)], fill=ORANGE, width=LINE_W)
        draw.line([(tag_line_x - TICK, ty),                 (tag_line_x + TICK, ty)],                 fill=ORANGE, width=LINE_W)
        tag_y_label = f"{TAG_OFFSET_IN:.{LABEL_DECIMALS}f} in ({TAG_OFFSET_IN * 2.54:.{LABEL_DECIMALS}f} cm)"
        draw_label(draw, tag_y_label, tag_line_x + TICK + 35, (TAG_COLLAR_Y_FRONT + ty) // 2, font)
        # X: tag is always centered
        draw_label(draw, "centered", tx + tw // 2, ty + th + FONT_SIZE // 2 + 4, font)

    # ── Side panel: compute raw sizes at SIDE_PPI for all items ──────────────
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

    # One shared scale_up so all items stay proportional to each other
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
            # Placeholder: light grey rectangle so layout is visible without the file
            tag_panel_img = Image.new("RGBA", (tag_panel_w, tag_panel_h), (210, 210, 210, 200))

    # ── Layout: size the expanded canvas ─────────────────────────────────────
    mw, mh    = mockup.width, mockup.height
    col_w     = max(side_gw, tag_panel_w)          # column wide enough for both items
    tag_gap   = SIDE_MARGIN_BOTTOM                  # vertical gap between elem and tag sections

    # Total height of side content (elem + optional tag below)
    side_content_h = side_gh
    if tag_panel_img is not None:
        side_content_h += tag_gap + tag_panel_h + SIDE_MARGIN_BOTTOM  # include tag bracket room

    sg_x  = mw + SIDE_PAD_LEFT
    sg_y  = max(0, (mh - side_content_h) // 2)

    # Print element centred in column
    elem_x = sg_x + (col_w - side_gw) // 2

    # Tag centred in column, below elem + bracket space
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

    # Brackets for print element
    w_label = f"{measurements['elem_w_in']:.{LABEL_DECIMALS}f} in ({measurements['elem_w_in'] * 2.54:.{LABEL_DECIMALS}f} cm)  [{measurements['tier']}]"
    h_label = f"{measurements['elem_h_in']:.{LABEL_DECIMALS}f} in ({measurements['elem_h_in'] * 2.54:.{LABEL_DECIMALS}f} cm)"
    draw_dimension_bracket(draw2, elem_x, sg_y + side_gh + PAD,
                           elem_x + side_gw, sg_y + side_gh + PAD,
                           w_label, font, 'horizontal')
    draw_dimension_bracket(draw2, elem_x + side_gw + PAD, sg_y,
                           elem_x + side_gw + PAD, sg_y + side_gh,
                           h_label, font, 'vertical')

    # Brackets for tag
    if tag_panel_img is not None:
        tw_label = f"{tag_panel_w_in:.{LABEL_DECIMALS}f} in ({tag_panel_w_in * 2.54:.{LABEL_DECIMALS}f} cm)"
        th_label = f"{tag_panel_h_in:.{LABEL_DECIMALS}f} in ({tag_panel_h_in * 2.54:.{LABEL_DECIMALS}f} cm)"
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

    # Back side only: distance from shirt's left edge to graphic's left edge
    x_from_shirt_in = 0.0
    if _side == "back" and x_dir != "centered":
        _bp = _PLACEMENTS["back"]
        shirt_left_offset_in = (_bp["x"] - BACK_SHIRT_LEFT_PX) / (_bp["w"] / PHYSICAL_W_IN)
        x_from_shirt_in = shirt_left_offset_in + x_min * px_to_in

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
    y_label = "0.0 in from top" if y_in < 0.005 else f"{y_in:.{LABEL_DECIMALS}f} in ({y_in * 2.54:.{LABEL_DECIMALS}f} cm) from top"
    draw_label(draw, y_label, MARGIN_LEFT // 2, mid_y, font)

    # 3. X offset — horizontal line in top margin
    hy = MARGIN_TOP // 2
    if _side == "back":
        # Back side: measure from shirt left edge (off-canvas) to graphic left.
        # Shirt edge is outside the canvas, so just drop a tick + connector at bx0.
        if x_dir != "centered":
            x_label = f"{x_from_shirt_in:.{LABEL_DECIMALS}f} in ({x_from_shirt_in * 2.54:.{LABEL_DECIMALS}f} cm) from shirt left"
            draw.line([(bx0, hy - TICK), (bx0, hy + TICK)], fill=ORANGE, width=LINE_W)
            draw_dashed_line(draw, bx0, hy, bx0, by0, color=ORANGE)
            draw_label(draw, x_label, bx0, hy // 2 + 4, font)
        # else centered → no X annotation
    else:
        # Front / other: measure from print-area center to graphic left edge
        draw_dashed_line(draw, cx_s, hy, bx0, hy, color=ORANGE)
        draw.line([(cx_s, hy - TICK), (cx_s, hy + TICK)], fill=ORANGE, width=LINE_W)
        draw.line([(bx0,  hy - TICK), (bx0,  hy + TICK)], fill=ORANGE, width=LINE_W)
        draw_dashed_line(draw, bx0, hy, bx0, by0, color=ORANGE)
        x_label = ("centered" if x_dir == "centered"
                   else f"{x_offset_in:.{LABEL_DECIMALS}f} in ({x_offset_in * 2.54:.{LABEL_DECIMALS}f} cm) {x_dir}")
        draw_label(draw, x_label, (cx_s + bx0) // 2, hy // 2 + 4, font)

    # 4. Size + tier label below the bounding box
    size_text = f"{elem_w_in:.{LABEL_DECIMALS}f}\" × {elem_h_in:.{LABEL_DECIMALS}f}\" ({elem_w_in * 2.54:.{LABEL_DECIMALS}f} × {elem_h_in * 2.54:.{LABEL_DECIMALS}f} cm)  [{tier}]"
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
        "y_label": y_label,
        "x_label": x_label,
        "elem_w_in": elem_w_in,
        "elem_h_in": elem_h_in,
        "tier": tier,
        "collar_y": COLLAR_Y.get(_side, 223),
        "collar_to_elem_in": COLLAR_TO_PRINT_AREA_IN + y_in,
        "x_dir": x_dir,
        "x_offset_in": x_offset_in,
        "x_from_shirt_in": x_from_shirt_in,
    }
    composite_on_mockup(img_full, mockup_path, placement, mockup_out, measurements, side=_side, show_tag=_show_tag)
    return mockup_out


def combine_mockups(paths, output_path=None, gap=COMBINE_GAP):
    """Combine multiple mockup images into a two-column grid.

    Each mockup file is split at _MOCKUP_W: the shirt portion goes in the left
    column and the graphic side panel goes in the right column. Rows are stacked
    vertically with `gap` pixels between them.

    Layout:
        [shirt 1]  |  [graphic 1]
        [shirt 2]  |  [graphic 2]
        ...
    """
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
    """Full pipeline: annotate each side, then combine into one image.

    Each entry in `sides` must have:
        "input"  — path to the print PNG
        "mockup" — path to the blank shirt mockup template
        "side"   — "front" or "back"
    """
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
