from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

TOOLS_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TOOLS_DIR.parent
BACKEND_ENV = REPO_ROOT / "backend" / ".env"
TOOLS_ENV = TOOLS_DIR / ".env"

# Load backend/.env first, then tools/.env; shell env wins if already set.
for env_path in (BACKEND_ENV, TOOLS_ENV):
    if env_path.is_file():
        load_dotenv(env_path, override=False)


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name} (set in {BACKEND_ENV} or {TOOLS_ENV})")
    return value


def get_supabase_credentials() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = (
        os.getenv("SUPABASE_SECRET_KEY")
        or os.getenv("SUPABASE_PUBLISHABLE_KEY")
        or ""
    ).strip()
    return url, key


def config_errors() -> list[str]:
    """Return human-readable list of missing required settings."""
    missing: list[str] = []
    url, key = get_supabase_credentials()
    if not url:
        missing.append("SUPABASE_URL")
    if not key:
        missing.append("SUPABASE_SECRET_KEY (service role preferred for ops)")
    return missing


def is_configured() -> bool:
    return not config_errors()


# Legacy module-level reads (re-evaluated after dotenv load above)
SUPABASE_URL, SUPABASE_KEY = get_supabase_credentials()

CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")

R2_PUBLIC_URLS = {
    "design-previews": os.getenv("R2_PUBLIC_URL_PREVIEWS", ""),
    "print-files": os.getenv("R2_PUBLIC_URL_PRINT", ""),
    "design-assets": os.getenv("R2_PUBLIC_URL_ASSETS", ""),
    "print-files-ordered": os.getenv("R2_PUBLIC_URL_PRINT_ORDERED", ""),
}

OPS_HOST = os.getenv("OPS_HOST", "127.0.0.1")
OPS_PORT = int(os.getenv("OPS_PORT", "5051"))

ORDER_STATUSES = [
    "pending_payment",
    "paid_processing",
    "printing",
    "shipped",
    "delivered",
    "cancelled",
]

SHIRT_SIZES = ["S", "M", "L", "XL", "XXL", "2XL", "3XL"]
COLOR_CATEGORIES = ["White", "Other"]
TEMPLATE_SIDES = ["front", "back", "left_sleeve", "right_sleeve"]
