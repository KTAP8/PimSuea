from __future__ import annotations

import json
from typing import Any

from .config import ORDER_STATUSES
from .db import get_db


def list_orders(status: str | None = None) -> list[dict]:
    db = get_db()
    query = db.table("orders").select(
        "id, user_id, total_amount, status, created_at, coupon_code, delivery_fee, discount_amount"
    ).order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    orders = query.execute().data or []

    if not orders:
        return []

    order_ids = [o["id"] for o in orders]
    items = db.table("order_items").select("order_id").in_("order_id", order_ids).execute().data or []
    counts: dict[str, int] = {}
    for item in items:
        oid = item["order_id"]
        counts[oid] = counts.get(oid, 0) + 1

    for o in orders:
        o["item_count"] = counts.get(o["id"], 0)
    return orders


def get_order(order_id: str) -> dict | None:
    db = get_db()
    res = db.table("orders").select("*").eq("id", order_id).maybe_single().execute()
    return res.data


def get_order_items(order_id: str) -> list[dict]:
    db = get_db()
    rows = db.table("order_items").select(
        "id, quantity, size, color, unit_price, print_file_url, mockup_file_url, user_design_id"
    ).eq("order_id", order_id).execute().data or []

    design_ids = [r["user_design_id"] for r in rows if r.get("user_design_id")]
    designs_by_id: dict[str, dict] = {}
    if design_ids:
        designs = db.table("user_designs").select(
            "id, design_name, base_product_id, print_file_url, preview_image_url"
        ).in_("id", design_ids).execute().data or []
        designs_by_id = {d["id"]: d for d in designs}

    for row in rows:
        did = row.get("user_design_id")
        row["user_design"] = designs_by_id.get(did) if did else None
    return rows


def update_order_status(order_id: str, status: str, tracking_number: str | None = None) -> None:
    if status not in ORDER_STATUSES:
        raise ValueError(f"Invalid status: {status}")
    data: dict[str, Any] = {"status": status}
    if tracking_number is not None:
        data["tracking_number"] = tracking_number.strip() or None
    get_db().table("orders").update(data).eq("id", order_id).execute()


def parse_print_file_url(raw: str | None) -> dict[str, str]:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return {k: str(v) for k, v in parsed.items()}
    except (json.JSONDecodeError, TypeError):
        pass
    return {"front": raw}


def get_profile_email(user_id: str | None) -> str | None:
    if not user_id:
        return None
    row = get_db().table("profiles").select("email, full_name").eq("id", user_id).maybe_single().execute().data
    if not row:
        return None
    return row.get("email") or row.get("full_name")
