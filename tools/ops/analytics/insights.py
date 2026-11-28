"""Deterministic, rule-based callouts. Each insight carries the numbers behind it.

level: critical | warning | good | info   (rendered with icon + label, never colour alone)
"""
from __future__ import annotations

from datetime import date, timedelta

from . import metrics as m

COMMUNITY_GOAL = 10


def _pct(x: float) -> str:
    return f"{x * 100:.0f}%"


def _thb(x: float) -> str:
    return f"฿{x:,.0f}"


def _windows(today: date) -> tuple[str, str, str]:
    end = (today + timedelta(days=1)).isoformat()
    mid = (today - timedelta(days=29)).isoformat()
    start = (today - timedelta(days=59)).isoformat()
    return start, mid, end


def build(snap: dict, today: date) -> list[dict]:
    db, ph, meta = snap["supabase"], snap["posthog"], snap["meta"]
    users, orders = db.get("users", []), db.get("orders", [])
    prev_start, cur_start, end = _windows(today)
    out: list[dict] = []

    def add(level: str, title: str, detail: str, area: str) -> None:
        out.append({"level": level, "title": title, "detail": detail, "area": area})

    # Funnel: where do signed-up users stop?
    funnel = m.signup_funnel(users)
    drop = m.biggest_drop(funnel)
    if drop:
        add("critical" if drop[2] > 0.6 else "warning",
            f"Biggest leak: {drop[0]} → {drop[1]} ({_pct(drop[2])} lost)",
            " → ".join(f"{label} {n}" for label, n in funnel), "Funnel")

    # Studio funnel (behavioural)
    if ph.get("status") == "ok":
        sf = m.studio_funnel(ph["persons"])
        sd = m.biggest_drop(sf)
        if sd:
            add("warning", f"Studio: {_pct(sd[2])} drop between '{sd[0]}' and '{sd[1]}'",
                " → ".join(f"{label} {n}" for label, n in sf), "Studio")
        fails = m.daily_event_total(ph["daily"], "studio_add_to_cart_failed", cur_start, end)
        wins = m.daily_event_total(ph["daily"], "studio_add_to_cart", cur_start, end)
        if fails and fails / (fails + wins) > 0.1:
            add("critical", f"Add-to-cart failing {_pct(fails / (fails + wins))} of the time (last 30d)",
                f"{fails} failed vs {wins} succeeded — check 'Auto-save failed' path.", "Studio")
        shown = m.daily_event_total(ph["daily"], "promo_popup_shown", "0000", end)
        cta = m.daily_event_total(ph["daily"], "promo_popup_cta", "0000", end)
        if shown >= 30:
            add("warning" if cta / shown < 0.03 else "good",
                f"Promo popup CTR {_pct(cta / shown)}", f"{shown} impressions, {cta} clicks.", "Acquisition")

        cur_v, prev_v = m.new_visitors(ph["persons"], cur_start, end), m.new_visitors(ph["persons"], prev_start, cur_start)
        if prev_v:
            change = cur_v / prev_v - 1
            add("good" if change > 0.1 else "warning" if change < -0.1 else "info",
                f"New visitors {cur_v} in last 30d ({'+' if change >= 0 else ''}{_pct(change)} vs prior 30d)",
                f"Prior period: {prev_v}.", "Acquisition")
        total_pv = m.daily_event_total(ph["daily"], "$pageview", cur_start, end)
        th_pv = sum(r["n"] for r in ph["daily"]
                    if r["event"] == "$pageview" and r["lang"] == "th" and cur_start <= r["d"] < end)
        if total_pv:
            add("info", f"English pages: {_pct(1 - th_pv / total_pv)} of marketing pageviews (last 30d)",
                f"{total_pv - th_pv} EN vs {th_pv} TH pageviews. Pivot target audience = English.", "Acquisition")

    # Channel quality
    channels = [c for c in m.channel_table(users, orders) if c["signups"] >= 10 and c["channel"] != "(none)"]
    if len(channels) >= 2:
        best = max(channels, key=lambda c: c["pay_rate"])
        biggest = max(channels, key=lambda c: c["signups"])
        if best["channel"] != biggest["channel"] and best["pay_rate"] > biggest["pay_rate"]:
            add("good", f"'{best['channel']}' converts best: {_pct(best['pay_rate'])} of signups pay",
                f"vs '{biggest['channel']}' (largest, {biggest['signups']} signups) at {_pct(biggest['pay_rate'])}. "
                f"Revenue {_thb(best['revenue'])} vs {_thb(biggest['revenue'])}.", "Acquisition")

    # Revenue shape
    rs = m.revenue_stats(m.paid_orders(orders))
    if rs["orders"] and rs["top_share"] > 0.5:
        add("warning", f"Top order = {_pct(rs['top_share'])} of all revenue",
            f"{rs['orders']} paid orders, {_thb(rs['revenue'])} total; median {_thb(rs['aov_median'])}, "
            f"mean {_thb(rs['aov_mean'])}. Bulk (≥10 shirts) = {_pct(rs['bulk_revenue'] / rs['revenue'])}.",
            "Revenue")

    carts = db.get("open_carts") or {}
    if carts.get("never_ordered"):
        add("warning", f"{carts['units_waiting']} shirts sitting in {carts['never_ordered']} abandoned carts",
            "Users with cart items and no paid order — a reminder email / LINE nudge is the cheapest revenue.",
            "Revenue")

    used = {o["coupon"] for o in orders if o["paid"] and o.get("coupon")}
    add("info", f"Community codes used: {len(used)} / {COMMUNITY_GOAL} goal",
        "Distinct coupon codes on paid orders (expat GTM: 10 communities in 8 weeks).", "Revenue")

    recent = [u for u in users if m.in_range(u["signup"], cur_start, end)]
    if recent:
        tagged = sum(1 for u in recent if u.get("ft_utm_source") or u.get("ft_referrer"))
        add("info" if tagged else "warning", f"Attribution coverage: {_pct(tagged / len(recent))} of last-30d signups",
            "Share of signups with a captured UTM/referrer (needs the attribution release + migration).", "Tracking")

    _meta_insights(meta, rs, add)
    return out


def _meta_insights(meta: dict, rs: dict, add) -> None:
    if meta.get("status") != "ok":
        add("info", "Meta Ads not connected", meta.get("hint") or meta.get("error", ""), "Ads")
        return
    rows = meta["daily"]
    spend = sum(r["spend"] for r in rows)
    purchases = sum(r["purchases"] for r in rows)
    if spend:
        add("info", f"Meta spend {_thb(spend)} → {purchases} pixel purchases",
            f"Pixel CPA {_thb(spend / purchases) if purchases else 'n/a'}; median order {_thb(rs['aov_median'])}.", "Ads")
    by_adset: dict[str, dict] = {}
    for r in rows:
        a = by_adset.setdefault(r["adset"], {"spend": 0.0, "purchases": 0, "registrations": 0})
        a["spend"] += r["spend"]
        a["purchases"] += r["purchases"]
        a["registrations"] += r["registrations"]
    breakeven = rs["aov_median"] or 0
    for name, a in by_adset.items():
        if breakeven and a["spend"] > 2 * breakeven and a["purchases"] == 0:
            add("critical", f"Pause candidate: ad set '{name}'",
                f"Spent {_thb(a['spend'])} (>2× median order) with 0 purchases, {a['registrations']} signups.", "Ads")
