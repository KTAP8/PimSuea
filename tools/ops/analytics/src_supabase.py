"""Row-level business data from Supabase (service-role client, read only).

No names, emails or addresses leave this module: users are keyed by their uuid.
"""
from __future__ import annotations

from datetime import datetime

from ..db import get_db
from .config import BKK, PAID_STATUSES

PAGE = 1000


def _all(table: str, cols: str) -> list[dict]:
    db, rows, start = get_db(), [], 0
    while True:
        batch = db.table(table).select(cols).range(start, start + PAGE - 1).execute().data or []
        rows.extend(batch)
        if len(batch) < PAGE:
            return rows
        start += PAGE


def _bkk(ts: str | None) -> str | None:
    """ISO timestamp → Bangkok ISO timestamp (minute precision)."""
    if not ts:
        return None
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    return dt.astimezone(BKK).strftime("%Y-%m-%dT%H:%M")


def _first(events: dict[str, str], key: str, ts: str | None) -> None:
    if ts and (key not in events or ts < events[key]):
        events[key] = ts


def _touch(attr: dict | None) -> dict:
    ft = (attr or {}).get("first_touch") or {}
    return {k: ft.get(k) for k in ("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "referrer")}


def _profiles_cols() -> str:
    base = "id, created_at, referral_source, referral_detail, design_purpose, onboarding_completed"
    return base + ", attribution"


def fetch() -> dict:
    try:
        profiles = _all("profiles", _profiles_cols())
        orders = _all("orders", "id, user_id, total_amount, delivery_fee, discount_amount, coupon_code, status, "
                                "payment_method, paid_at, created_at, attribution")
    except Exception:  # attribution column not migrated yet
        profiles = _all("profiles", _profiles_cols().replace(", attribution", ""))
        orders = _all("orders", "id, user_id, total_amount, delivery_fee, discount_amount, coupon_code, status, "
                                "payment_method, paid_at, created_at")
    designs = _all("user_designs", "user_id, created_at, is_ordered, printing_type")
    carts = _all("cart_items", "user_id, created_at, quantity")
    drafts = _all("checkout_drafts", "user_id, status, created_at")
    items = _all("order_items", "order_id, quantity, unit_price, size, color, is_gift, addon_code, addon_fee_thb")
    colors = {c["id"]: c["name"] for c in _all("colors", "id, name")}

    firsts: dict[str, dict[str, str]] = {}
    for d in designs:
        _first(firsts.setdefault(d["user_id"], {}), "first_design", _bkk(d["created_at"]))
    for c in carts:
        _first(firsts.setdefault(c["user_id"], {}), "first_cart", _bkk(c["created_at"]))
    for d in drafts:
        _first(firsts.setdefault(d["user_id"], {}), "first_checkout", _bkk(d["created_at"]))

    items_by_order: dict[str, list[dict]] = {}
    for it in items:
        items_by_order.setdefault(it["order_id"], []).append({
            "qty": it.get("quantity") or 0,
            "unit": float(it.get("unit_price") or 0),
            "size": it.get("size") or "?",
            "color": colors.get(it.get("color"), it.get("color") or "?"),
            "gift": bool(it.get("is_gift")),
            "addon_fee": float(it.get("addon_fee_thb") or 0),
        })

    out_orders = []
    for o in orders:
        paid = o.get("status") in PAID_STATUSES
        ts = _bkk(o.get("paid_at") or o.get("created_at"))
        lines = items_by_order.get(o["id"], [])
        if paid:
            _first(firsts.setdefault(o["user_id"], {}), "first_paid", ts)
        out_orders.append({
            "id": o["id"], "user_id": o["user_id"], "ts": ts, "paid": paid, "status": o.get("status"),
            "total": float(o.get("total_amount") or 0), "delivery": float(o.get("delivery_fee") or 0),
            "discount": float(o.get("discount_amount") or 0), "coupon": o.get("coupon_code"),
            "pay": o.get("payment_method") or "unknown", "qty": sum(i["qty"] for i in lines),
            "items": lines, **{f"ft_{k}": v for k, v in _touch(o.get("attribution")).items()},
        })

    users = []
    for p in profiles:
        f = _monotonic(firsts.get(p["id"], {}))
        users.append({
            "id": p["id"], "signup": _bkk(p["created_at"]),
            "source": p.get("referral_source") or "(none)", "source_detail": p.get("referral_detail"),
            "purpose": p.get("design_purpose") or "(none)", "onboarded": bool(p.get("onboarding_completed")),
            **{f"ft_{k}": v for k, v in _touch(p.get("attribution")).items()},
            **f,
        })

    return {
        "status": "ok",
        "users": users,
        "orders": out_orders,
        "drafts": [{"ts": _bkk(d["created_at"]), "status": d["status"]} for d in drafts],
        "open_carts": _open_carts(carts, orders),
    }


STAGES = ("first_design", "first_cart", "first_checkout", "first_paid")


def _monotonic(f: dict[str, str]) -> dict[str, str]:
    """Pre-Stripe orders have no draft/cart rows: a later stage implies the earlier ones."""
    out = dict(f)
    for i in range(len(STAGES) - 2, -1, -1):
        later = out.get(STAGES[i + 1])
        if later and not out.get(STAGES[i]):
            out[STAGES[i]] = later
    return out


def _open_carts(carts: list[dict], orders: list[dict]) -> dict:
    ordered_users = {o["user_id"] for o in orders if o.get("status") in PAID_STATUSES}
    users = {c["user_id"] for c in carts}
    abandoned = users - ordered_users
    return {"users_with_cart": len(users), "never_ordered": len(abandoned),
            "units_waiting": sum(c.get("quantity") or 0 for c in carts if c["user_id"] in abandoned)}
