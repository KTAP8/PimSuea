"""PostHog via HogQL (POST /api/projects/{id}/query/). Needs a personal API key with query:read."""
from __future__ import annotations

import requests

from .config import LOOKBACK_DAYS, posthog_settings

TZ = "Asia/Bangkok"
STUDIO_STEPS = ("studio_opened", "studio_canvas_ready", "studio_artwork_added",
                "studio_save_succeeded", "studio_order_opened", "studio_add_to_cart")
FAILURES = ("studio_canvas_blank", "studio_template_load_failed", "studio_artwork_restore_failed",
            "studio_upload_failed", "studio_save_failed", "studio_mockup_failed", "studio_add_to_cart_failed")
WINDOW = f"timestamp > now() - interval {LOOKBACK_DAYS} day"


def _ts(expr: str) -> str:
    return f"formatDateTime(toTimeZone({expr}, '{TZ}'), '%Y-%m-%dT%H:%i')"


def _first_of(event: str) -> str:
    inner = f"minIf(timestamp, event = '{event}')"
    return f"{_ts(inner)} AS {event}"


PERSONS_SQL = f"""
SELECT
  argMax(distinct_id, timestamp) AS distinct_id,
  {_ts('min(timestamp)')} AS first_seen,
  argMin(properties.$pathname, timestamp) AS landing,
  argMin(properties.$referring_domain, timestamp) AS referrer,
  any(properties.ft_utm_source) AS utm_source,
  any(properties.ft_utm_campaign) AS utm_campaign,
  any(properties.ft_utm_term) AS utm_term,
  any(properties.ft_utm_content) AS utm_content,
  any(properties.viewport) AS device,
  countIf(event = '$pageview') AS pageviews,
  {', '.join(_first_of(e) for e in STUDIO_STEPS)},
  countIf(event = 'studio_left' AND properties.had_artwork = false) AS left_empty
FROM events
WHERE {WINDOW}
GROUP BY person_id
LIMIT 100000
"""

DAILY_SQL = f"""
SELECT toDate(toTimeZone(timestamp, '{TZ}')) AS d, event,
       if(properties.$pathname LIKE '/th%', 'th', 'en') AS lang,
       count() AS n, uniq(person_id) AS u
FROM events
WHERE {WINDOW} AND event IN ('$pageview', {', '.join(repr(e) for e in STUDIO_STEPS + FAILURES)},
                             'studio_left', 'promo_popup_shown', 'promo_popup_cta')
GROUP BY d, event, lang
ORDER BY d
LIMIT 100000
"""

PAGES_SQL = f"""
SELECT toDate(toTimeZone(timestamp, '{TZ}')) AS d, properties.$pathname AS path,
       count() AS n, uniq(person_id) AS u
FROM events
WHERE {WINDOW} AND event = '$pageview'
GROUP BY d, path
LIMIT 100000
"""

READY_SQL = f"""
SELECT toDate(toTimeZone(timestamp, '{TZ}')) AS d,
       quantile(0.5)(toFloat(properties.time_to_ready_ms)) AS p50,
       quantile(0.9)(toFloat(properties.time_to_ready_ms)) AS p90
FROM events
WHERE {WINDOW} AND event = 'studio_canvas_ready'
GROUP BY d ORDER BY d
"""


def _query(cfg: dict, sql: str) -> list[dict]:
    res = requests.post(
        f"{cfg['host']}/api/projects/{cfg['project']}/query/",
        headers={"Authorization": f"Bearer {cfg['key']}"},
        json={"query": {"kind": "HogQLQuery", "query": sql}, "name": "pimsuea-ops-analytics"},
        timeout=120,
    )
    if res.status_code >= 400:
        raise RuntimeError(f"PostHog {res.status_code}: {res.text[:300]}")
    body = res.json()
    cols = body.get("columns") or []
    return [dict(zip(cols, row)) for row in body.get("results") or []]


def _clean_person(row: dict) -> dict:
    """minIf() on no match yields the epoch; turn it into None."""
    return {k: (None if isinstance(v, str) and v.startswith("1970-01-01") else v) for k, v in row.items()}


def fetch() -> dict:
    cfg = posthog_settings()
    if not cfg:
        return {"status": "not_connected",
                "hint": "Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID in tools/.env"}
    try:
        return {
            "status": "ok",
            "host": cfg["host"],
            "project": cfg["project"],
            "persons": [_clean_person(r) for r in _query(cfg, PERSONS_SQL)],
            "daily": [{**r, "d": str(r["d"])} for r in _query(cfg, DAILY_SQL)],
            "pages": [{**r, "d": str(r["d"])} for r in _query(cfg, PAGES_SQL)],
            "ready": [{**r, "d": str(r["d"])} for r in _query(cfg, READY_SQL)],
        }
    except Exception as exc:  # surface in UI, keep other sources alive
        return {"status": "error", "error": str(exc)[:500]}
