from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from .config import BACKEND_ENV, TOOLS_ENV, get_supabase_credentials


@lru_cache(maxsize=1)
def get_db() -> Client:
    url, key = get_supabase_credentials()
    if not url or not key:
        raise RuntimeError(
            f"Supabase not configured. Create {BACKEND_ENV} with SUPABASE_URL and "
            f"SUPABASE_SECRET_KEY (see README). You can also use {TOOLS_ENV}."
        )
    return create_client(url, key)
