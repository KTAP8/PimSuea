#!/usr/bin/env bash
# Verify public GEO surfaces (run after deploy or locally with MARKETING_ORIGIN).
set -euo pipefail

ORIGIN="${MARKETING_ORIGIN:-https://pimsuea.com}"
FAIL=0

check() {
  local path="$1"
  local needle="$2"
  local body
  body="$(curl -fsSL "${ORIGIN}${path}" || true)"
  if [[ -z "$body" ]]; then
    echo "FAIL ${path} — no response"
    FAIL=1
    return
  fi
  if [[ -n "$needle" ]] && ! grep -q "$needle" <<<"$body"; then
    echo "FAIL ${path} — missing: ${needle}"
    FAIL=1
    return
  fi
  echo "OK   ${path}"
}

echo "Checking ${ORIGIN} …"
check "/robots.txt" "GPTBot"
check "/robots.txt" "PerplexityBot"
check "/robots.txt" "ClaudeBot"
check "/llms.txt" "PimSuea"
check "/llms.txt" "custom-shirt-no-minimum"
check "/sitemap.xml" "club-and-gift-shirts"
check "/custom-shirt-no-minimum" "ไม่มีขั้นต่ำ"
check "/club-and-gift-shirts" "ชมรม"
check "/pricing" "THB"
check "/vs-printful" "Printful"

if [[ "$FAIL" -ne 0 ]]; then
  echo "One or more checks failed."
  exit 1
fi
echo "All GEO public checks passed."
