"""Resolve product mockup images + placement from Supabase (same as design studio)."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

from ops import products as products_svc
from ops import r2 as r2mod


def normalize_placement(raw: dict | None) -> dict | None:
    if not raw:
        return None
    return {
        "x": int(float(raw.get("x", 0))),
        "y": int(float(raw.get("y", 0))),
        "w": int(float(raw.get("w", raw.get("width", 716)))),
        "h": int(float(raw.get("h", raw.get("height", 955)))),
    }


def find_template(product_id: str, color: str, side: str) -> dict | None:
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


def template_has_mockup(tpl: dict) -> bool:
    mc = tpl.get("mockup_config") or {}
    return bool(mc.get("image_url"))


def list_catalog_products() -> list[dict]:
    """Active products that have at least one template with mockup_config."""
    out: list[dict] = []
    for p in products_svc.list_products():
        if not p.get("is_active"):
            continue
        tpls = products_svc.get_product_templates(p["id"])
        if not any(template_has_mockup(t) for t in tpls):
            continue
        out.append({
            "id": p["id"],
            "title": p.get("title") or "",
            "title_en": p.get("title_en"),
        })
    return out


def list_mockup_colors(product_id: str) -> list[dict]:
    """Distinct colors on templates that have a mockup photo."""
    seen: set[str] = set()
    colors: list[dict] = []
    for tpl in products_svc.get_product_templates(product_id):
        if not template_has_mockup(tpl):
            continue
        cid = tpl.get("color_id") or "white"
        if cid in seen:
            continue
        seen.add(cid)
        color_row = tpl.get("color") or {}
        colors.append({
            "id": cid,
            "name": color_row.get("name") or cid,
        })
    return colors


def resolve_side_mockup(product_id: str, color_id: str, side: str) -> dict:
    tpl = find_template(product_id, color_id, side)
    if not tpl:
        raise ValueError(
            f"No template for product={product_id} side={side} color={color_id}",
        )
    mockup_cfg = tpl.get("mockup_config") or {}
    mockup_url = mockup_cfg.get("image_url")
    if not mockup_url:
        raise ValueError(
            f"Template {side}/{color_id} has no mockup_config.image_url "
            "(canvas template only — set mockup image in ops product edit).",
        )
    placement = normalize_placement(mockup_cfg.get("placement"))
    if not placement:
        raise ValueError(f"Template {side}/{color_id} has no mockup placement.")
    name = Path(urlparse(mockup_url).path).name or f"{side}_{color_id}"
    return {
        "mockup_url": mockup_url,
        "placement": placement,
        "label": name,
        "side": side,
        "color_id": tpl.get("color_id") or color_id,
    }


def download_mockup_file(mockup_url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(r2mod.download_url(mockup_url))
    return dest
