"""Meta Marketing API: ad-level daily insights (needs a System User token with ads_read)."""
from __future__ import annotations

from datetime import date, timedelta

import requests

from .config import LOOKBACK_DAYS, meta_settings

FIELDS = ",".join([
    "date_start", "campaign_name", "adset_name", "ad_name", "ad_id",
    "spend", "impressions", "reach", "frequency", "clicks", "inline_link_clicks",
    "actions", "action_values",
])
ACTIONS = {
    "landing_page_view": "lpv",
    "offsite_conversion.fb_pixel_view_content": "view_content",
    "offsite_conversion.fb_pixel_complete_registration": "registrations",
    "offsite_conversion.fb_pixel_add_to_cart": "add_to_cart",
    "offsite_conversion.fb_pixel_initiate_checkout": "checkouts",
    "offsite_conversion.fb_pixel_purchase": "purchases",
    "offsite_conversion.fb_pixel_lead": "leads",
}
MAX_LOOKBACK = min(LOOKBACK_DAYS, 37 * 30)  # Meta keeps ~37 months


def _num(v) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def _row(r: dict) -> dict:
    out = {
        "d": r["date_start"], "campaign": r.get("campaign_name") or "?", "adset": r.get("adset_name") or "?",
        "ad": r.get("ad_name") or "?", "ad_id": r.get("ad_id"),
        "spend": _num(r.get("spend")), "impressions": int(_num(r.get("impressions"))),
        "reach": int(_num(r.get("reach"))), "clicks": int(_num(r.get("clicks"))),
        "link_clicks": int(_num(r.get("inline_link_clicks"))),
    }
    for key in ACTIONS.values():
        out[key] = 0
    out["purchase_value"] = 0.0
    for a in r.get("actions") or []:
        if a.get("action_type") in ACTIONS:
            out[ACTIONS[a["action_type"]]] = int(_num(a.get("value")))
    for a in r.get("action_values") or []:
        if a.get("action_type") == "offsite_conversion.fb_pixel_purchase":
            out["purchase_value"] = _num(a.get("value"))
    return out


def fetch() -> dict:
    cfg = meta_settings()
    if not cfg:
        return {"status": "not_connected",
                "hint": "Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in tools/.env"}
    until = date.today()
    since = until - timedelta(days=MAX_LOOKBACK)
    url = f"https://graph.facebook.com/{cfg['version']}/{cfg['account']}/insights"
    params = {
        "access_token": cfg["token"], "level": "ad", "time_increment": 1, "fields": FIELDS,
        "time_range": f'{{"since":"{since}","until":"{until}"}}', "limit": 500,
    }
    rows: list[dict] = []
    try:
        while url:
            res = requests.get(url, params=params, timeout=60)
            body = res.json()
            if res.status_code >= 400 or "error" in body:
                msg = (body.get("error") or {}).get("message") or res.text[:300]
                raise RuntimeError(f"Meta {res.status_code}: {msg}")
            rows.extend(_row(r) for r in body.get("data") or [])
            url, params = (body.get("paging") or {}).get("next"), None
        return {"status": "ok", "account": cfg["account"], "daily": rows}
    except Exception as exc:
        return {"status": "error", "error": str(exc)[:500]}
