from __future__ import annotations

import json
import shutil
import tempfile
import uuid
from pathlib import Path

from . import orders as orders_svc
from . import products as products_svc
from . import r2 as r2mod


def _normalize_placement(raw: dict | None) -> dict | None:
    if not raw:
        return None
    return {
        "x": int(float(raw.get("x", 0))),
        "y": int(float(raw.get("y", 0))),
        "w": int(float(raw.get("w", raw.get("width", 716)))),
        "h": int(float(raw.get("h", raw.get("height", 955)))),
    }


def _find_template(product_id: str, color: str, side: str) -> dict | None:
    templates = products_svc.get_product_templates(product_id)
    color_lower = (color or "").lower()

    for tpl in templates:
        if tpl.get("side") != side:
            continue
        cid = (tpl.get("color_id") or "").lower()
        if cid == color_lower:
            return tpl

    for tpl in templates:
        if tpl.get("side") == side and tpl.get("is_default"):
            return tpl

    for tpl in templates:
        if tpl.get("side") == side:
            return tpl
    return None


def prepare_order_item_print(
    order_id: str,
    item_id: str,
    *,
    show_tag: bool = False,
    text_color: str = "black",
) -> dict:
    """Download print files + mockups from R2/URLs, run Tip annotate, return output paths."""
    import sys
    tools_dir = Path(__file__).resolve().parent.parent
    if str(tools_dir) not in sys.path:
        sys.path.insert(0, str(tools_dir))
    import Tip_annotate as tip

    items = orders_svc.get_order_items(order_id)
    item = next((i for i in items if i["id"] == item_id), None)
    if not item:
        raise ValueError("Order item not found")

    design = item.get("user_design") or {}
    product_id = design.get("base_product_id")
    if not product_id:
        raise ValueError("Order item has no linked product design")

    print_map = orders_svc.parse_print_file_url(item.get("print_file_url"))
    if not print_map:
        print_map = orders_svc.parse_print_file_url(design.get("print_file_url"))

    if not print_map:
        raise ValueError("No print files found for this order item")

    work_dir = Path(tempfile.mkdtemp(prefix=f"ops_print_{order_id}_"))
    sides = []

    try:
        for side, print_url in print_map.items():
            tpl = _find_template(product_id, item.get("color", ""), side)
            if not tpl:
                raise ValueError(f"No product template for side={side} color={item.get('color')}")

            mockup_cfg = tpl.get("mockup_config") or {}
            mockup_url = mockup_cfg.get("image_url")
            if not mockup_url:
                raise ValueError(f"Template {side} has no mockup_config.image_url")

            print_data = r2mod.download_url(print_url)
            print_path = work_dir / f"{side}_print.png"
            print_path.write_bytes(print_data)

            mockup_data = r2mod.download_url(mockup_url)
            mockup_path = work_dir / f"{side}_mockup{Path(mockup_url).suffix or '.jpg'}"
            mockup_path.write_bytes(mockup_data)

            placement = _normalize_placement(mockup_cfg.get("placement"))

            sides.append({
                "input": str(print_path),
                "mockup": str(mockup_path),
                "side": side,
                "show_tag": show_tag and side == "front",
                "text_color": text_color,
                "placement": placement,
            })

        combined_out = work_dir / "combined.png" if len(sides) >= 2 else None
        batch = tip.run_batch_entries(sides, combined_out)

        files = []
        for side_result in batch["sides"]:
            side = side_result["side"]
            for key, label, preview in [
                ("annotated", f"{side.title()} annotated", True),
                ("mockup", f"{side.title()} mockup", True),
                ("cmyk", f"{side.title()} CMYK", False),
            ]:
                path = side_result.get(key)
                if path:
                    p = Path(path)
                    dest = work_dir / p.name
                    if p.resolve() != dest.resolve() and p.exists():
                        shutil.copy2(p, dest)
                    files.append({
                        "name": dest.name,
                        "label": label,
                        "path": str(dest),
                        "preview": preview,
                    })

        if batch.get("combined"):
            comb = Path(batch["combined"])
            dest = work_dir / "combined.png"
            if comb.exists():
                shutil.copy2(comb, dest)
                files.append({
                    "name": "combined.png",
                    "label": "Combined",
                    "path": str(dest),
                    "preview": True,
                })

        session_id = uuid.uuid4().hex
        return {
            "session_id": session_id,
            "work_dir": str(work_dir),
            "files": files,
            "measurements": [s.get("measurements") for s in batch["sides"]],
            "sides_processed": [s["side"] for s in sides],
        }
    except Exception:
        shutil.rmtree(work_dir, ignore_errors=True)
        raise
