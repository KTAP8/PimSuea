"""
rgb_to_cmyk.py — Convert RGB print PNG(s) to CMYK TIFF for supplier submission.

Same manual workflow as annotate_print.py:
  1. Set INPUT_PATH to your RGB PNG print file.
     Or populate BATCH_PATHS for multiple files in one run.
  2. Run:  python tools/rgb_to_cmyk.py
  3. Output: <input>_cmyk.tif saved alongside the original.

ICC profile:
  The script downloads JapanColor2001Coated.icc into tools/profiles/
  automatically on first run. Internet access required once.

Dependencies:
  pip install pillow
"""

from pathlib import Path
import urllib.request
from PIL import Image, ImageCms

# ─── CONFIG ──────────────────────────────────────────────────────────────────
INPUT_PATH  = "/Volumes/My Passport/Personal_Project/PimSuea/tools/test_data/IBC_front_printfile_5.png"    # ← set to your RGB PNG path; leave "" to use BATCH_PATHS
OUTPUT_PATH = None  # None = auto: <input>_cmyk.tif alongside the original

# Batch mode: list of input paths; leave [] to use INPUT_PATH above
BATCH_PATHS = [
    # "/path/to/front_printfile.png",
    # "/path/to/back_printfile.png",
]

# ICC profile for CMYK conversion
ICC_PROFILE = "JapanColor2001Coated"  # change to "USWebCoatedSWOP" or "Fogra39" if supplier requests

# TIFF compression: "tiff_lzw" (lossless, recommended) or None (uncompressed)
TIFF_COMPRESSION = "tiff_lzw"

# Print file DPI — must match the export setting in DesignCanvas (300 DPI)
PRINT_DPI = 300
# ─────────────────────────────────────────────────────────────────────────────


_PROFILES_DIR = Path(__file__).parent / "profiles"

_PROFILE_CONFIG = {
    "JapanColor2001Coated": {
        "filename": "JapanColor2001Coated.icc",
        "url": "https://www.color.org/registry/profiles/JapanColor2001Coated.icc",
    },
    "USWebCoatedSWOP": {
        "filename": "USWebCoatedSWOP.icc",
        "url": "https://www.color.org/registry/profiles/USWebCoatedSWOP.icc",
    },
    "Fogra39": {
        "filename": "CoatedFOGRA39.icc",
        "url": "https://www.color.org/registry/profiles/CoatedFOGRA39.icc",
    },
}


def get_icc_path(name: str) -> Path:
    """Return local path to the ICC profile, downloading it if needed."""
    cfg = _PROFILE_CONFIG.get(name)
    if cfg is None:
        raise ValueError(f"Unknown ICC profile '{name}'. "
                         f"Valid options: {list(_PROFILE_CONFIG)}")

    local = _PROFILES_DIR / cfg["filename"]
    if local.exists():
        return local

    _PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"  Downloading {cfg['filename']} …")
    try:
        urllib.request.urlretrieve(cfg["url"], local)
        print(f"  Saved to {local}")
    except Exception as e:
        raise RuntimeError(
            f"\nFailed to download ICC profile: {e}\n"
            f"Manual fix:\n"
            f"  1. Download: {cfg['url']}\n"
            f"  2. Save to:  {local}"
        ) from e
    return local


def convert(input_path: str, output_path: str | None = None) -> Path:
    src = Path(input_path)
    if not src.exists():
        raise FileNotFoundError(f"Not found: {input_path}")

    out = (Path(output_path) if output_path
           else src.with_stem(src.stem + "_cmyk").with_suffix(".tif"))

    print(f"\n{'─' * 52}")
    print(f"  Input   : {src.name}")
    print(f"  Output  : {out.name}")
    print(f"  Profile : {ICC_PROFILE}")
    print(f"{'─' * 52}")

    icc_path = get_icc_path(ICC_PROFILE)
    print(f"  ICC     : {icc_path}")

    img = Image.open(src).convert("RGB")
    print(f"  Size    : {img.width} × {img.height} px  ({PRINT_DPI} DPI)")

    srgb  = ImageCms.createProfile("sRGB")
    cmyk  = ImageCms.getOpenProfile(str(icc_path))
    xform = ImageCms.buildTransform(
        srgb, cmyk, "RGB", "CMYK",
        renderingIntent=1,  # 1 = Relative Colorimetric
        flags=0x2000,  # Black Point Compensation
    )

    cmyk_img = ImageCms.applyTransform(img, xform)
    cmyk_img.save(out, compression=TIFF_COMPRESSION, dpi=(PRINT_DPI, PRINT_DPI))

    size_mb = out.stat().st_size / 1_048_576
    print(f"  Done    → {out}  ({size_mb:.1f} MB)\n")
    return out


if __name__ == "__main__":
    targets = BATCH_PATHS if BATCH_PATHS else ([INPUT_PATH] if INPUT_PATH else [])
    if not targets:
        print("Set INPUT_PATH or BATCH_PATHS at the top of the script.")
    else:
        for p in targets:
            convert(p)
