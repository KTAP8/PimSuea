"""Pure aggregation helpers over snapshot rows (no I/O). Timestamps are Bangkok 'YYYY-MM-DDTHH:MM'."""
from __future__ import annotations

from collections import defaultdict
from statistics import median


def in_range(ts: str | None, start: str, end: str) -> bool:
    """start inclusive, end exclusive, on 'YYYY-MM-DD' prefixes."""
    return bool(ts) and start <= ts[:10] < end


def paid_orders(orders: list[dict], start: str = "0000", end: str = "9999") -> list[dict]:
    return [o for o in orders if o["paid"] and in_range(o["ts"], start, end)]


def revenue_stats(orders: list[dict]) -> dict:
    totals = sorted((o["total"] for o in orders), reverse=True)
    revenue = sum(totals)
    return {
        "orders": len(totals), "revenue": revenue,
        "aov_mean": revenue / len(totals) if totals else 0,
        "aov_median": median(totals) if totals else 0,
        "top_share": totals[0] / revenue if revenue else 0,
        "units": sum(o["qty"] for o in orders),
        "bulk_revenue": sum(o["total"] for o in orders if o["qty"] >= 10),
    }


def signup_funnel(users: list[dict], start: str = "0000", end: str = "9999") -> list[tuple[str, int]]:
    cohort = [u for u in users if in_range(u["signup"], start, end)]
    return [
        ("Signed up", len(cohort)),
        ("Created a design", sum(1 for u in cohort if u.get("first_design"))),
        ("Added to cart", sum(1 for u in cohort if u.get("first_cart"))),
        ("Started checkout", sum(1 for u in cohort if u.get("first_checkout"))),
        ("Paid", sum(1 for u in cohort if u.get("first_paid"))),
    ]


def studio_funnel(persons: list[dict], start: str = "0000", end: str = "9999") -> list[tuple[str, int]]:
    """Strictly sequential: each step counts people who also passed every earlier step."""
    pool = [p for p in persons if in_range(p.get("studio_opened"), start, end)]
    labels = [("studio_opened", "Opened studio"), ("studio_canvas_ready", "Canvas loaded"),
              ("studio_artwork_added", "Added artwork"), ("studio_save_succeeded", "Saved design"),
              ("studio_order_opened", "Opened order panel"), ("studio_add_to_cart", "Added to cart")]
    out = []
    for key, label in labels:
        pool = [p for p in pool if p.get(key)]
        out.append((label, len(pool)))
    return out


def biggest_drop(steps: list[tuple[str, int]]) -> tuple[str, str, float] | None:
    worst = None
    for (a, na), (b, nb) in zip(steps, steps[1:]):
        if na < 5:
            continue
        loss = 1 - nb / na
        if worst is None or loss > worst[2]:
            worst = (a, b, loss)
    return worst


def channel_table(users: list[dict], orders: list[dict], key: str = "source") -> list[dict]:
    revenue_by_user: dict[str, float] = defaultdict(float)
    for o in orders:
        if o["paid"]:
            revenue_by_user[o["user_id"]] += o["total"]
    rows: dict[str, dict] = {}
    for u in users:
        ch = u.get(key) or "(none)"
        r = rows.setdefault(ch, {"channel": ch, "signups": 0, "designers": 0, "payers": 0, "revenue": 0.0})
        r["signups"] += 1
        r["designers"] += bool(u.get("first_design"))
        r["payers"] += bool(u.get("first_paid"))
        r["revenue"] += revenue_by_user.get(u["id"], 0)
    for r in rows.values():
        r["pay_rate"] = r["payers"] / r["signups"] if r["signups"] else 0
    return sorted(rows.values(), key=lambda r: -r["signups"])


def daily_event_total(daily: list[dict], event: str, start: str, end: str, field: str = "n") -> int:
    return sum(r[field] for r in daily if r["event"] == event and start <= r["d"] < end)


def new_visitors(persons: list[dict], start: str, end: str) -> int:
    return sum(1 for p in persons if in_range(p.get("first_seen"), start, end))
