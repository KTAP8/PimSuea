# Tip Annotate Tool

Admin tool for **Tip brand** print files: measure design placement, annotate with Thai inch labels, composite onto shirt mockups, convert to CMYK for supplier submission, and combine front/back into one review image.

Built for 300 DPI print PNGs on a **12" × 16"** physical print area.

---

## What it does

Given a customer print file (PNG with transparency), the tool:

1. **Detects the design bounding box** (non-transparent / non-white pixels)
2. **Calculates measurements** — size tier (3×4in / A5 / A4 / A3), Y offset from top, X offset from shirt center to the nearest design edge
3. **Generates an annotated preview** — dotted measurement lines with Thai labels (`X นิ้ว Y กระเบียด`, where 1 กระเบียด = 0.25 in)
4. **Composites onto a shirt mockup** — design pasted into the print area, with collar-to-design and side-panel dimension brackets
5. **Converts the original print to CMYK TIFF** — JapanColor2001Coated ICC profile, 300 DPI, alpha preserved (for supplier handoff)
6. **Combines front + back mockups** into one image when both sides are processed

### Tip vs PimSuea variant

This is the **Tip** variant (`Tip_annotate.py`). Differences from `annotate_print.py`:

- X measurement goes from **shirt center → nearest edge** of the design (not always the same edge)
- Labels use **Thai units only** (no cm suffix)

---

## Quick start (Web UI — recommended)

### 1. Install dependencies

```bash
cd tools
pip install -r requirements-annotate.txt
```

On first CMYK conversion, the JapanColor2001Coated ICC profile is downloaded automatically into `tools/profiles/` (internet required once).

### 2. Start the server

```bash
python tip_annotate_web.py
```

Open **http://127.0.0.1:5050**

### 3. Use the form

| Section | What to set |
|---------|-------------|
| **Front** (optional) | Upload print PNG, pick mockup template, toggle tag overlay, choose label color |
| **Back** (optional) | Same as front |
| **Generate** | Enabled once at least one print file is selected |

Mockup templates are loaded from `tools/templates/` (dropdown is populated automatically).

### 4. Download results

After processing, the page shows measurement summaries, image previews, and download links.

| Output | When |
|--------|------|
| `{side}_annotated.png` | Always (per uploaded side) |
| `{side}_mockup_{side}.png` | When mockup template exists |
| `{side}_cmyk.tif` | Always (per uploaded side) |
| `combined.png` | When **both** front and back are submitted |

CMYK files are download-only (TIFF does not preview inline in the browser).

### Stop the server

Press `Ctrl+C` in the terminal, or:

```bash
pkill -f "python tip_annotate_web.py"
```

---

## CLI usage (script mode)

For batch runs without the browser, edit the config block at the top of `Tip_annotate.py` and run:

```bash
python Tip_annotate.py
```

### Single file

Set `INPUT_PATH`, `SHIRT_SIDE`, `MOCKUP_IMAGE_PATH`, etc. Leave `BATCH_SIDES = []`.

Outputs next to the input file:

- `<input>_annotated.png`
- `<input>_mockup_<side>.png`
- `<input>_cmyk.tif`

### Batch mode (front and/or back)

Populate `BATCH_SIDES`:

```python
BATCH_SIDES = [
    {
        "input": "/path/to/front.png",
        "mockup": "/path/to/tools/templates/merch_white_front.JPG",
        "side": "front",
        "show_tag": False,
        "text_color": "red",
    },
    {
        "input": "/path/to/back.png",
        "mockup": "/path/to/tools/templates/merch_white_back.JPG",
        "side": "back",
        "show_tag": False,
        "text_color": "black",
    },
]
```

When two sides produce mockups, a `<first_input_stem>_combined.png` is also created.

---

## File layout

```
tools/
├── Tip_annotate.py           # Core pipeline (annotate, mockup, batch)
├── tip_annotate_web.py       # Flask web server
├── rgb_to_cmyk.py            # CMYK conversion (called automatically)
├── static/
│   └── tip_annotate.html     # Web UI
├── templates/                # Shirt mockup images (pick in UI dropdown)
│   ├── merch_white_front.JPG
│   ├── merch_white_back.JPG
│   ├── merch_black_front.png
│   ├── front_white_mock_template.png
│   ├── back_white_mock_template.png
│   └── Tag.png               # Logo tag overlay (not a mockup)
├── profiles/                 # ICC profiles (auto-downloaded)
└── requirements-annotate.txt
```

---

## Mockup templates

Place shirt mockup images in `tools/templates/`. Supported formats: `.png`, `.jpg`, `.jpeg`.

The web UI lists all image files in that folder except `Tag.png` (used only as a logo overlay when **Show tag** is enabled on front).

Common pairings:

| Side | Template |
|------|----------|
| Front white | `merch_white_front.JPG` |
| Back white | `merch_white_back.JPG` |
| Front black | `merch_black_front.png` |

Print-area placement is hardcoded in `Tip_annotate.py` (`_PLACEMENTS`) and must match the mockup image dimensions (2048 × 1742 px canvas).

---

## Options reference

| Option | Values | Applies to |
|--------|--------|------------|
| `side` | `front`, `back` | Which mockup placement / collar reference to use |
| `show_tag` | `true` / `false` | Overlay logo tag on front mockup (front only) |
| `text_color` | `black`, `red` | Measurement label color on annotated + mockup outputs |

---

## CMYK output

CMYK conversion uses the same logic as `rgb_to_cmyk.py`:

- **Profile:** JapanColor2001Coated (configurable in `rgb_to_cmyk.py` → `ICC_PROFILE`)
- **DPI:** 300
- **Format:** TIFF with LZW compression
- **Alpha:** Preserved as a 5th channel when the source PNG has transparency

To convert files standalone (without annotating):

```bash
python rgb_to_cmyk.py
```

(Set `INPUT_PATH` or `BATCH_PATHS` at the top of that script.)

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `pillow` | Image processing, ICC color transform |
| `numpy` | Content bounding-box detection |
| `flask` | Web UI server |
| `tifffile` | CMYK + alpha TIFF output |
| `imagecodecs` | TIFF compression |

Install all at once:

```bash
pip install -r requirements-annotate.txt
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `[mockup] Not found: … — skipping mockup output` | Check template filename and path; web UI only lists files in `tools/templates/` |
| CMYK skipped / ICC download failed | Download manually from [color.org](https://www.color.org/registry/profiles/JapanColor2001Coated.icc) → save to `tools/profiles/JapanColor2001Coated.icc` |
| Thai labels show as boxes | Install THSarabun or a system Thai font; the script tries several macOS paths automatically |
| Session expired on download | Re-run Generate; download links expire after 1 hour |
| Port 5050 in use | Stop the other process or change the port in `tip_annotate_web.py` |

---

## Related tools

| Script | Purpose |
|--------|---------|
| `annotate_print.py` | PimSuea brand variant (inch labels, different X measurement) |
| `rgb_to_cmyk.py` | Standalone RGB → CMYK TIFF conversion |
