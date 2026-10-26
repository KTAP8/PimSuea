"""
tip_annotate_web.py — Local Flask UI for Tip_annotate.py

Upload print PNGs (front and/or back), pick mockups from the catalog (same as
the design studio) or local tools/templates/, and get annotated / mockup outputs.

Usage:
  pip install -r requirements-annotate.txt
  python tip_annotate_web.py
  open http://127.0.0.1:5053
"""

from __future__ import annotations

import shutil
import sys
import tempfile
import threading
import time
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_file, send_from_directory

TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import Tip_annotate as tip

try:
    from ops.config import config_errors, is_configured
    import catalog_mockups
    _CATALOG_AVAILABLE = is_configured()
except Exception:
    _CATALOG_AVAILABLE = False
    config_errors = lambda: ["Supabase not configured"]  # noqa: E731

TEMPLATES_DIR = TOOLS_DIR / "templates"
STATIC_DIR = TOOLS_DIR / "static"
SESSION_TTL_SEC = 3600
EXCLUDED_TEMPLATES = {"Tag.png"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg"}
LOCAL_MOCKUP_SKIP_SUBSTR = ("mock_template",)

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="/static")

# session_id -> {"dir": Path, "created": float}
_sessions: dict[str, dict] = {}
_sessions_lock = threading.Lock()


def _cleanup_old_sessions() -> None:
    now = time.time()
    with _sessions_lock:
        expired = [
            sid for sid, meta in _sessions.items()
            if now - meta["created"] > SESSION_TTL_SEC
        ]
        for sid in expired:
            meta = _sessions.pop(sid, None)
            if meta and meta["dir"].exists():
                shutil.rmtree(meta["dir"], ignore_errors=True)


def _safe_template_name(name: str) -> Path:
    """Resolve a template filename inside TEMPLATES_DIR; reject path traversal."""
    if not name or Path(name).name != name:
        raise ValueError(f"Invalid template name: {name!r}")
    if name.startswith("._") or name in EXCLUDED_TEMPLATES:
        raise ValueError(f"Template not allowed: {name!r}")
    path = (TEMPLATES_DIR / name).resolve()
    if not str(path).startswith(str(TEMPLATES_DIR.resolve())):
        raise ValueError(f"Invalid template path: {name!r}")
    if not path.is_file():
        raise FileNotFoundError(f"Template not found: {name}")
    return path


def _list_local_templates() -> list[str]:
    if not TEMPLATES_DIR.is_dir():
        return []
    names = []
    for p in sorted(TEMPLATES_DIR.iterdir()):
        if not p.is_file():
            continue
        if p.name.startswith("._"):
            continue
        if p.name in EXCLUDED_TEMPLATES:
            continue
        if p.suffix.lower() not in IMAGE_EXTS:
            continue
        lower = p.name.lower()
        if any(skip in lower for skip in LOCAL_MOCKUP_SKIP_SUBSTR):
            continue
        names.append(p.name)
    return names


def _save_upload(file_storage, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    file_storage.save(dest)
    return dest


def _bool_form(val: str | None) -> bool:
    if val is None:
        return False
    return val.strip().lower() in {"1", "true", "yes", "on"}


def _ensure_named(src: Path, dest: Path) -> Path:
    """Copy src → dest if names differ; return dest path that exists."""
    if src.resolve() == dest.resolve():
        return dest
    shutil.copy2(src, dest)
    return dest


def _resolve_mockup_for_side(
    work_dir: Path,
    side: str,
    *,
    product_id: str | None,
    color_id: str | None,
    local_name: str | None,
) -> tuple[str, dict | None, dict]:
    """Return (mockup_path, placement, source_info) for annotate batch."""
    if product_id and color_id:
        if not _CATALOG_AVAILABLE:
            raise RuntimeError(
                "Catalog mockups require SUPABASE_URL and SUPABASE_SECRET_KEY "
                "in backend/.env",
            )
        resolved = catalog_mockups.resolve_side_mockup(product_id, color_id, side)
        suffix = Path(resolved["label"]).suffix or ".webp"
        mockup_path = work_dir / f"{side}_catalog_mockup{suffix}"
        catalog_mockups.download_mockup_file(resolved["mockup_url"], mockup_path)
        source = {
            "side": side,
            "label": resolved["label"],
            "placement": resolved["placement"],
            "source": "catalog",
        }
        return str(mockup_path), resolved["placement"], source

    if not local_name:
        raise ValueError(
            f"Pick a product/color for {side}, or choose a local mockup template.",
        )
    mockup_path = _safe_template_name(local_name)
    source = {
        "side": side,
        "label": local_name,
        "placement": None,
        "source": "local",
    }
    return str(mockup_path), None, source


@app.get("/")
def index():
    return send_from_directory(STATIC_DIR, "tip_annotate.html")


@app.get("/api/config")
def api_config():
    return jsonify({
        "catalog_available": _CATALOG_AVAILABLE,
        "config_errors": config_errors() if not _CATALOG_AVAILABLE else [],
    })


@app.get("/api/products")
def api_products():
    if not _CATALOG_AVAILABLE:
        return jsonify({"products": [], "error": "Supabase not configured"}), 503
    try:
        return jsonify({"products": catalog_mockups.list_catalog_products()})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/products/<product_id>/mockups")
def api_product_mockups(product_id: str):
    if not _CATALOG_AVAILABLE:
        return jsonify({"error": "Supabase not configured"}), 503
    try:
        colors = catalog_mockups.list_mockup_colors(product_id)
        color_id = request.args.get("color", "").strip()
        side_only = request.args.get("side", "").strip()
        active_color = color_id or (colors[0]["id"] if colors else "white")

        if side_only:
            return jsonify({
                "side": catalog_mockups.resolve_side_mockup(
                    product_id, active_color, side_only,
                ),
            })

        sides: dict[str, dict | None] = {"front": None, "back": None}
        for side in ("front", "back"):
            try:
                sides[side] = catalog_mockups.resolve_side_mockup(
                    product_id, active_color, side,
                )
            except ValueError:
                sides[side] = None
        return jsonify({
            "colors": colors,
            "color_id": active_color,
            "sides_preview": sides,
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/templates")
def api_templates():
    return jsonify({"templates": _list_local_templates()})


@app.post("/api/process")
def api_process():
    _cleanup_old_sessions()

    front_print = request.files.get("front_print")
    back_print = request.files.get("back_print")
    has_front = front_print is not None and bool(front_print.filename)
    has_back = back_print is not None and bool(back_print.filename)

    if not has_front and not has_back:
        return jsonify({"error": "Upload at least one print file (front and/or back)."}), 400

    mock_source = (request.form.get("mock_source") or "catalog").strip().lower()
    product_id = request.form.get("product_id", "").strip() or None
    color_id = request.form.get("color_id", "").strip() or None
    use_catalog = mock_source == "catalog" and product_id and color_id

    front_mockup = request.form.get("front_mockup", "").strip()
    back_mockup = request.form.get("back_mockup", "").strip()

    if has_front:
        if use_catalog:
            pass
        elif not front_mockup:
            return jsonify({"error": "front_mockup is required when uploading a front print."}), 400
    if has_back:
        if use_catalog:
            pass
        elif not back_mockup:
            return jsonify({"error": "back_mockup is required when uploading a back print."}), 400

    if not use_catalog and not (front_mockup or back_mockup):
        return jsonify({
            "error": "Select a catalog product and color, or local mockup templates.",
        }), 400

    session_id = uuid.uuid4().hex
    work_dir = Path(tempfile.mkdtemp(prefix=f"tip_annotate_{session_id}_"))
    with _sessions_lock:
        _sessions[session_id] = {"dir": work_dir, "created": time.time()}

    try:
        sides = []
        mockup_sources = []

        if has_front:
            mockup_path, placement, source = _resolve_mockup_for_side(
                work_dir, "front",
                product_id=product_id if use_catalog else None,
                color_id=color_id if use_catalog else None,
                local_name=front_mockup or None,
            )
            mockup_sources.append(source)
            ext = Path(front_print.filename).suffix or ".png"
            front_path = work_dir / f"front{ext}"
            _save_upload(front_print, front_path)
            entry = {
                "input": str(front_path),
                "mockup": mockup_path,
                "side": "front",
                "show_tag": _bool_form(request.form.get("front_show_tag")),
                "text_color": request.form.get("front_text_color") or "black",
            }
            if placement is not None:
                entry["placement"] = placement
            sides.append(entry)

        if has_back:
            mockup_path, placement, source = _resolve_mockup_for_side(
                work_dir, "back",
                product_id=product_id if use_catalog else None,
                color_id=color_id if use_catalog else None,
                local_name=back_mockup or None,
            )
            mockup_sources.append(source)
            ext = Path(back_print.filename).suffix or ".png"
            back_path = work_dir / f"back{ext}"
            _save_upload(back_print, back_path)
            entry = {
                "input": str(back_path),
                "mockup": mockup_path,
                "side": "back",
                "show_tag": _bool_form(request.form.get("back_show_tag")),
                "text_color": request.form.get("back_text_color") or "black",
            }
            if placement is not None:
                entry["placement"] = placement
            sides.append(entry)

        combined_out = work_dir / "combined.png" if len(sides) >= 2 else None
        batch = tip.run_batch_entries(sides, combined_out)

        files = []
        measurements = []

        for side_result in batch["sides"]:
            side = side_result["side"]
            m = side_result["measurements"]
            measurements.append({
                "side": side,
                "elem_w_in": m["elem_w_in"],
                "elem_h_in": m["elem_h_in"],
                "tier": m["tier"],
                "y_in": m["y_in"],
                "y_label": m["y_label"],
                "x_offset_in": m["x_offset_in"],
                "x_dir": m["x_dir"],
                "x_label": m["x_label"],
                "size_label": m["size_label"],
                "collar_to_elem_in": m["collar_to_elem_in"],
                "image_w": m["image_w"],
                "image_h": m["image_h"],
            })

            ann_name = f"{side}_annotated.png"
            annotated = _ensure_named(
                Path(side_result["annotated"]), work_dir / ann_name)
            files.append({
                "name": ann_name,
                "label": f"{side.title()} annotated",
                "url": f"/api/download/{session_id}/{ann_name}",
                "preview": True,
            })

            mockup = side_result.get("mockup")
            if mockup:
                mock_name = f"{side}_mockup_{side}.png"
                _ensure_named(Path(mockup), work_dir / mock_name)
                files.append({
                    "name": mock_name,
                    "label": f"{side.title()} mockup",
                    "url": f"/api/download/{session_id}/{mock_name}",
                    "preview": True,
                })

            cmyk = side_result.get("cmyk")
            if cmyk:
                cmyk_name = f"{side}_cmyk.tif"
                _ensure_named(Path(cmyk), work_dir / cmyk_name)
                files.append({
                    "name": cmyk_name,
                    "label": f"{side.title()} CMYK",
                    "url": f"/api/download/{session_id}/{cmyk_name}",
                    "preview": False,
                })

        if batch.get("combined"):
            comb_name = "combined.png"
            _ensure_named(Path(batch["combined"]), work_dir / comb_name)
            files.append({
                "name": comb_name,
                "label": "Combined",
                "url": f"/api/download/{session_id}/{comb_name}",
                "preview": True,
            })

        return jsonify({
            "session_id": session_id,
            "measurements": measurements,
            "files": files,
            "mock_source": "catalog" if use_catalog else "local",
            "mockup_sources": mockup_sources,
        })

    except Exception as exc:
        with _sessions_lock:
            meta = _sessions.pop(session_id, None)
        if meta and meta["dir"].exists():
            shutil.rmtree(meta["dir"], ignore_errors=True)
        return jsonify({"error": str(exc)}), 500


@app.get("/api/download/<session_id>/<filename>")
def api_download(session_id: str, filename: str):
    if Path(filename).name != filename or ".." in filename:
        return jsonify({"error": "Invalid filename"}), 400

    with _sessions_lock:
        meta = _sessions.get(session_id)
    if not meta:
        return jsonify({"error": "Session expired or not found"}), 404

    path = meta["dir"] / filename
    if not path.is_file():
        return jsonify({"error": "File not found"}), 404

    lower = filename.lower()
    if lower.endswith((".tif", ".tiff")):
        mimetype = "image/tiff"
    else:
        mimetype = "image/png"

    return send_file(path, mimetype=mimetype, as_attachment=False,
                     download_name=filename)


if __name__ == "__main__":
    print("Tip Annotate UI → http://127.0.0.1:5053")
    if _CATALOG_AVAILABLE:
        print("  Catalog mockups: enabled (backend/.env Supabase)")
    else:
        print("  Catalog mockups: disabled —", ", ".join(config_errors()))
    app.run(host="127.0.0.1", port=5053, debug=False)
