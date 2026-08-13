from __future__ import annotations

import copy
import json
import uuid
from typing import Any

from .config import COLOR_CATEGORIES, SHIRT_SIZES, TEMPLATE_SIDES
from .db import get_db
from . import r2 as r2mod


def list_products() -> list[dict]:
    db = get_db()
    products = db.table("products").select(
        "id, title, is_active, min_price, base_price, category_id, created_at"
    ).order("created_at", desc=True).execute().data or []

    template_counts: dict[str, int] = {}
    tpl_rows = db.table("product_templates").select("product_id").execute().data or []
    for row in tpl_rows:
        pid = row["product_id"]
        template_counts[pid] = template_counts.get(pid, 0) + 1

    for p in products:
        p["template_count"] = template_counts.get(p["id"], 0)
    return products


def get_product(product_id: str) -> dict | None:
    db = get_db()
    res = db.table("products").select("*").eq("id", product_id).maybe_single().execute()
    return res.data


def get_categories() -> list[dict]:
    return get_db().table("categories").select("id, name").order("name").execute().data or []


def get_colors() -> list[dict]:
    return get_db().table("colors").select("id, name, hex_code").order("name").execute().data or []


def get_print_methods() -> list[dict]:
    return get_db().table("print_methods").select("id, name").order("name").execute().data or []


def get_product_images(product_id: str) -> list[dict]:
    rows = get_db().table("product_images").select("*").eq(
        "product_id", product_id
    ).order("display_order").execute().data or []
    return rows


def get_product_templates(product_id: str) -> list[dict]:
    rows = get_db().table("product_templates").select(
        "*, color:colors(id, name, hex_code)"
    ).eq("product_id", product_id).execute().data or []
    return sorted(rows, key=lambda r: (r.get("color_id") or "", r.get("side") or ""))


def get_product_print_methods(product_id: str) -> list[str]:
    rows = get_db().table("product_print_methods").select(
        "print_method_id"
    ).eq("product_id", product_id).execute().data or []
    return [r["print_method_id"] for r in rows]


def get_shirt_pricing(product_id: str) -> list[dict]:
    rows = get_db().table("shirt_pricing").select("*").eq(
        "product_id", product_id
    ).order("color_name").order("size").order("min_qty").execute().data or []
    return rows


def update_product_metadata(product_id: str, payload: dict) -> None:
    allowed = {
        "title", "details", "care_instructions", "is_active",
        "is_beginner_friendly", "category_id", "base_price", "min_price",
        "size_guide",
    }
    data = {k: v for k, v in payload.items() if k in allowed}
    get_db().table("products").update(data).eq("id", product_id).execute()


def clone_product(source_id: str, new_title: str | None = None) -> str:
    db = get_db()
    src = get_product(source_id)
    if not src:
        raise ValueError("Source product not found")

    new_id = str(uuid.uuid4())
    product_row = {
        "id": new_id,
        "title": new_title or f"{src['title']} (copy)",
        "details": src.get("details"),
        "care_instructions": src.get("care_instructions"),
        "base_price": src.get("base_price"),
        "min_price": src.get("min_price"),
        "key_features": src.get("key_features"),
        "size_guide": src.get("size_guide"),
        "is_beginner_friendly": src.get("is_beginner_friendly", False),
        "is_active": False,
        "category_id": src.get("category_id"),
    }
    db.table("products").insert(product_row).execute()

    for img in get_product_images(source_id):
        db.table("product_images").insert({
            "product_id": new_id,
            "image_url": img["image_url"],
            "display_order": img.get("display_order", 0),
            "alt_text": img.get("alt_text"),
            "is_hover": img.get("is_hover", False),
            "is_printable": img.get("is_printable", False),
            "print_area_config": img.get("print_area_config"),
        }).execute()

    for tpl in get_product_templates(source_id):
        db.table("product_templates").insert({
            "product_id": new_id,
            "side": tpl["side"],
            "color_id": tpl.get("color_id"),
            "image_url": tpl["image_url"],
            "print_area_config": tpl["print_area_config"],
            "mockup_config": tpl.get("mockup_config"),
            "is_default": tpl.get("is_default", False),
        }).execute()

    for pm in get_product_print_methods(source_id):
        db.table("product_print_methods").insert({
            "product_id": new_id,
            "print_method_id": pm,
        }).execute()

    for row in get_shirt_pricing(source_id):
        db.table("shirt_pricing").insert({
            "product_id": new_id,
            "color_name": row["color_name"],
            "size": row["size"],
            "min_qty": row["min_qty"],
            "max_qty": row.get("max_qty"),
            "price_per_unit_thb": row["price_per_unit_thb"],
        }).execute()

    return new_id


def upsert_gallery_image(product_id: str, image_url: str, display_order: int, is_hover: bool) -> None:
    get_db().table("product_images").insert({
        "product_id": product_id,
        "image_url": image_url,
        "display_order": display_order,
        "is_hover": is_hover,
    }).execute()


def delete_gallery_image(image_id: str) -> None:
    get_db().table("product_images").delete().eq("id", image_id).execute()


def save_template(product_id: str, template_id: str | None, form: dict) -> str:
    db = get_db()
    print_area = {
        "x": float(form.get("pa_x", 0)),
        "y": float(form.get("pa_y", 0)),
        "width": float(form.get("pa_width", 0)),
        "height": float(form.get("pa_height", 0)),
        "physical_w_cm": float(form.get("physical_w_cm", 30.48)),
        "physical_h_cm": float(form.get("physical_h_cm", 40.64)),
    }
    mockup_url = form.get("mockup_image_url", "").strip()
    mockup_config = None
    if mockup_url:
        mockup_config = {
            "image_url": mockup_url,
            "placement": {
                "x": float(form.get("mp_x", 647)),
                "y": float(form.get("mp_y", 431)),
                "w": float(form.get("mp_w", 716.4)),
                "h": float(form.get("mp_h", 955.2)),
            },
        }

    row = {
        "product_id": product_id,
        "side": form.get("side", "front"),
        "color_id": form.get("color_id") or "white",
        "image_url": form.get("image_url", "").strip(),
        "print_area_config": print_area,
        "mockup_config": mockup_config,
        "is_default": form.get("is_default") == "on",
    }

    if template_id:
        db.table("product_templates").update(row).eq("id", template_id).execute()
        return template_id

    res = db.table("product_templates").insert(row).execute()
    return res.data[0]["id"]


def delete_template(template_id: str) -> None:
    get_db().table("product_templates").delete().eq("id", template_id).execute()


def save_shirt_pricing_row(product_id: str, row_id: str | None, form: dict) -> None:
    data = {
        "product_id": product_id,
        "color_name": form.get("color_name", "White"),
        "size": form.get("size", "M"),
        "min_qty": int(form.get("min_qty", 1)),
        "max_qty": int(form["max_qty"]) if form.get("max_qty") else None,
        "price_per_unit_thb": float(form.get("price_per_unit_thb", 0)),
    }
    db = get_db()
    if row_id:
        db.table("shirt_pricing").update(data).eq("id", row_id).execute()
    else:
        db.table("shirt_pricing").insert(data).execute()


def delete_shirt_pricing_row(row_id: str) -> None:
    get_db().table("shirt_pricing").delete().eq("id", row_id).execute()


def set_product_print_methods(product_id: str, method_ids: list[str]) -> None:
    db = get_db()
    db.table("product_print_methods").delete().eq("product_id", product_id).execute()
    for mid in method_ids:
        db.table("product_print_methods").insert({
            "product_id": product_id,
            "print_method_id": mid,
        }).execute()


def migrate_product_assets_to_r2(product_id: str) -> dict[str, int]:
    """Copy Supabase/non-R2 template and gallery URLs to design-assets/catalog/."""
    counts = {"templates": 0, "images": 0, "mockups": 0}
    db = get_db()

    for tpl in get_product_templates(product_id):
        updates: dict[str, Any] = {}
        if tpl.get("image_url") and not r2mod.get_location_from_url(tpl["image_url"]):
            updates["image_url"] = r2mod.copy_url_to_catalog(
                tpl["image_url"], product_id, f"canvas_{tpl['side']}_{tpl.get('color_id', 'x')}"
            )
            counts["templates"] += 1
        mockup = tpl.get("mockup_config") or {}
        mock_url = mockup.get("image_url")
        if mock_url and not r2mod.get_location_from_url(mock_url):
            new_mock_url = r2mod.copy_url_to_catalog(
                mock_url, product_id, f"mockup_{tpl['side']}_{tpl.get('color_id', 'x')}"
            )
            mockup = copy.deepcopy(mockup)
            mockup["image_url"] = new_mock_url
            updates["mockup_config"] = mockup
            counts["mockups"] += 1
        if updates:
            db.table("product_templates").update(updates).eq("id", tpl["id"]).execute()

    for img in get_product_images(product_id):
        if img.get("image_url") and not r2mod.get_location_from_url(img["image_url"]):
            new_url = r2mod.copy_url_to_catalog(
                img["image_url"], product_id, f"gallery_{img.get('display_order', 0)}"
            )
            db.table("product_images").update({"image_url": new_url}).eq("id", img["id"]).execute()
            counts["images"] += 1

    return counts


def list_r2_assets(product_id: str) -> list[dict]:
    return r2mod.list_objects("design-assets", r2mod.catalog_prefix(product_id))


def upload_catalog_asset(product_id: str, file_storage, subfolder: str = "") -> str:
    name = file_storage.filename or "upload.bin"
    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in name)
    prefix = r2mod.catalog_prefix(product_id)
    if subfolder:
        key = f"{prefix}{subfolder.strip('/')}/{safe}"
    else:
        key = f"{prefix}{safe}"
    return r2mod.upload_file_obj("design-assets", key, file_storage)


def parse_print_area_config(raw: Any) -> dict:
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
    return {}
