"""Build one analytics snapshot: pull every source, compute insights, write JSON.

CLI: .venv/bin/python -m ops.analytics.snapshot [--if-due]
launchd calls it hourly with --if-due, so it pulls once per day after 17:00 Bangkok
regardless of the Mac's timezone or sleep.
"""
from __future__ import annotations

import json
import sys
import threading
from datetime import datetime, timedelta

from . import insights, src_meta, src_posthog, src_supabase
from .config import BKK, DATA_DIR, SCHEDULE_HOUR_BKK, unit_cost_thb

LATEST = DATA_DIR / "latest.json"
_lock = threading.Lock()
_state = {"running": False, "error": None, "finished_at": None}


def _safe(fn) -> dict:
    try:
        return fn()
    except Exception as exc:
        return {"status": "error", "error": str(exc)[:500]}


def build() -> dict:
    now = datetime.now(BKK)
    snap = {
        "generated_at": now.isoformat(timespec="seconds"),
        "unit_cost_thb": unit_cost_thb(),
        "supabase": _safe(src_supabase.fetch),
        "posthog": _safe(src_posthog.fetch),
        "meta": _safe(src_meta.fetch),
    }
    snap["insights"] = insights.build(snap, now.date())
    return snap


def write(snap: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    body = json.dumps(snap, ensure_ascii=False, default=str)
    (DATA_DIR / f"{snap['generated_at'][:10]}.json").write_text(body)
    tmp = LATEST.with_suffix(".tmp")
    tmp.write_text(body)
    tmp.replace(LATEST)


def run() -> dict:
    """Blocking build + write. Only one at a time."""
    if not _lock.acquire(blocking=False):
        raise RuntimeError("A refresh is already running")
    _state.update(running=True, error=None)
    try:
        snap = build()
        write(snap)
        return snap
    except Exception as exc:
        _state["error"] = str(exc)[:500]
        raise
    finally:
        _state.update(running=False, finished_at=datetime.now(BKK).isoformat(timespec="seconds"))
        _lock.release()


def run_in_background() -> bool:
    if _state["running"]:
        return False
    threading.Thread(target=lambda: _safe(run), daemon=True).start()
    return True


def status() -> dict:
    return {**_state, "generated_at": latest_generated_at(), "stale": is_stale()}


def load_latest() -> dict | None:
    return json.loads(LATEST.read_text()) if LATEST.is_file() else None


def latest_generated_at() -> str | None:
    snap = load_latest()
    return snap["generated_at"] if snap else None


def last_scheduled_run(now: datetime | None = None) -> datetime:
    now = now or datetime.now(BKK)
    slot = now.replace(hour=SCHEDULE_HOUR_BKK, minute=0, second=0, microsecond=0)
    return slot if now >= slot else slot - timedelta(days=1)


def is_stale() -> bool:
    gen = latest_generated_at()
    return gen is None or datetime.fromisoformat(gen) < last_scheduled_run()


if __name__ == "__main__":
    if "--if-due" in sys.argv and not is_stale():
        print(f"[analytics] up to date ({latest_generated_at()}), next slot after {SCHEDULE_HOUR_BKK}:00 Bangkok")
        sys.exit(0)
    result = run()
    sources = {k: result[k].get("status") for k in ("supabase", "posthog", "meta")}
    print(f"[analytics] snapshot {result['generated_at']} {sources} insights={len(result['insights'])}")
    sys.exit(0 if sources["supabase"] == "ok" else 1)
