from __future__ import annotations

import os
from pathlib import Path
from zoneinfo import ZoneInfo

from .. import config as _ops_config  # noqa: F401  (loads backend/.env + tools/.env)

BKK = ZoneInfo("Asia/Bangkok")
SCHEDULE_HOUR_BKK = 17
LOOKBACK_DAYS = 365

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "analytics"

PAID_STATUSES = ("paid_processing", "printing", "shipped", "delivered")
BULK_QTY = 10


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def posthog_settings() -> dict | None:
    key, project = _env("POSTHOG_PERSONAL_API_KEY"), _env("POSTHOG_PROJECT_ID")
    if not key or not project:
        return None
    return {"key": key, "project": project, "host": _env("POSTHOG_HOST", "https://eu.posthog.com").rstrip("/")}


def meta_settings() -> dict | None:
    token, account = _env("META_ACCESS_TOKEN"), _env("META_AD_ACCOUNT_ID")
    if not token or not account:
        return None
    if not account.startswith("act_"):
        account = f"act_{account}"
    return {"token": token, "account": account, "version": _env("META_API_VERSION", "v23.0")}


def unit_cost_thb() -> float | None:
    raw = _env("UNIT_COST_THB")
    try:
        return float(raw) if raw else None
    except ValueError:
        return None
