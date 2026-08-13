from __future__ import annotations

import mimetypes
import uuid
from functools import lru_cache
from pathlib import PurePosixPath
from urllib.parse import urlparse

import boto3
import requests
from botocore.client import BaseClient

from .config import (
    CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_PUBLIC_URLS,
    R2_SECRET_ACCESS_KEY,
)


@lru_cache(maxsize=1)
def get_r2() -> BaseClient:
    if not all([CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
        raise RuntimeError("Cloudflare R2 credentials must be set in backend/.env")
    return boto3.client(
        "s3",
        region_name="auto",
        endpoint_url=f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )


def get_public_url(bucket: str, key: str) -> str:
    base = R2_PUBLIC_URLS.get(bucket, "").rstrip("/")
    if not base:
        raise RuntimeError(f"No public URL configured for bucket: {bucket}")
    return f"{base}/{key.lstrip('/')}"


def get_location_from_url(url: str) -> tuple[str, str] | None:
    for bucket, base in R2_PUBLIC_URLS.items():
        if not base:
            continue
        prefix = base.rstrip("/") + "/"
        if url.startswith(prefix):
            return bucket, url[len(prefix):]
    return None


def list_objects(bucket: str, prefix: str = "") -> list[dict]:
    client = get_r2()
    paginator = client.get_paginator("list_objects_v2")
    items: list[dict] = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents") or []:
            key = obj["Key"]
            if key.endswith("/"):
                continue
            items.append({
                "key": key,
                "url": get_public_url(bucket, key),
                "name": PurePosixPath(key).name,
                "size": obj.get("Size", 0),
            })
    items.sort(key=lambda x: x["key"])
    return items


def upload_bytes(
    bucket: str,
    key: str,
    data: bytes,
    content_type: str | None = None,
) -> str:
    client = get_r2()
    extra = {}
    if content_type:
        extra["ContentType"] = content_type
    client.put_object(Bucket=bucket, Key=key, Body=data, **extra)
    return get_public_url(bucket, key)


def upload_file_obj(bucket: str, key: str, file_storage) -> str:
    data = file_storage.read()
    content_type = file_storage.content_type or mimetypes.guess_type(key)[0] or "application/octet-stream"
    return upload_bytes(bucket, key, data, content_type)


def download_url(url: str) -> bytes:
    loc = get_location_from_url(url)
    if loc:
        bucket, key = loc
        resp = get_r2().get_object(Bucket=bucket, Key=key)
        return resp["Body"].read()
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    return resp.content


def copy_url_to_catalog(source_url: str, product_id: str, label: str) -> str:
    """Download any URL and re-upload to design-assets/catalog/{product_id}/."""
    data = download_url(source_url)
    ext = PurePosixPath(urlparse(source_url).path).suffix or ".png"
    safe_label = "".join(c if c.isalnum() or c in "-_" else "_" for c in label)
    key = f"catalog/{product_id}/{safe_label}_{uuid.uuid4().hex[:8]}{ext}"
    content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"
    return upload_bytes("design-assets", key, data, content_type)


def catalog_prefix(product_id: str) -> str:
    return f"catalog/{product_id}/"
