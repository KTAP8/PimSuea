#!/usr/bin/env bash
# Verify public GEO surfaces (run after deploy or locally with MARKETING_ORIGIN).
# Marketing routes are a SPA: curl cannot see React-rendered body text. We check
# HTTP 200 + shell, and optionally that the JS bundle contains route copy.
set -euo pipefail

ORIGIN="${MARKETING_ORIGIN:-https://pimsuea.com}"
ORIGIN="${ORIGIN%/}"
FAIL=0

check_text() {
  local path="$1"
  local needle="$2"
  local body
  body="$(curl -fsSL "${ORIGIN}${path}" 2>/dev/null || true)"
  if [[ -z "$body" ]]; then
    echo "FAIL ${path} — no response"
    FAIL=1
    return
  fi
  if [[ -n "$needle" ]] && ! grep -qF "$needle" <<<"$body"; then
    echo "FAIL ${path} — missing: ${needle}"
    FAIL=1
    return
  fi
  echo "OK   ${path}"
}

# SPA route: 200 + empty root mount (content is client-rendered).
check_spa_route() {
  local path="$1"
  local bundle_needle="${2:-}"
  local html
  html="$(curl -fsSL -w "\n%{http_code}" "${ORIGIN}${path}" 2>/dev/null || true)"
  local code
  code="$(tail -n1 <<<"$html")"
  html="$(sed '$d' <<<"$html")"

  if [[ "$code" != "200" ]]; then
    echo "FAIL ${path} — HTTP ${code} (expected 200)"
    FAIL=1
    return
  fi
  if ! grep -q 'id="root"' <<<"$html"; then
    echo "FAIL ${path} — not an SPA shell (no #root)"
    FAIL=1
    return
  fi

  if [[ -n "$bundle_needle" ]]; then
    local asset
    asset="$(grep -oE '/assets/index-[^" ]+\.js' <<<"$html" | head -1)"
    if [[ -z "$asset" ]]; then
      echo "FAIL ${path} — could not find main JS bundle in HTML"
      FAIL=1
      return
    fi
    local js
    js="$(curl -fsSL "${ORIGIN}${asset}" 2>/dev/null || true)"
    if [[ -z "$js" ]] || ! grep -qF "$bundle_needle" <<<"$js"; then
      echo "FAIL ${path} — deployed bundle missing: ${bundle_needle}"
      echo "       (route may be old deploy, or string minified away — check in browser)"
      FAIL=1
      return
    fi
  fi

  echo "OK   ${path} (SPA 200${bundle_needle:+, bundle})"
}

echo "Checking ${ORIGIN} …"

check_text "/robots.txt" "GPTBot"
check_text "/robots.txt" "PerplexityBot"
check_text "/robots.txt" "ClaudeBot"
check_text "/llms.txt" "PimSuea"
check_text "/llms.txt" "custom-shirt-no-minimum"
check_text "/sitemap.xml" "club-and-gift-shirts"

check_spa_route "/custom-shirt-no-minimum" "custom-shirt-no-minimum"
check_spa_route "/club-and-gift-shirts" "club-and-gift-shirts"
check_spa_route "/pricing" "pricing"
check_spa_route "/vs-printful" "vs-printful"

if [[ "$FAIL" -ne 0 ]]; then
  echo ""
  echo "Note: Body text (Thai/Printful) only appears after JavaScript runs."
  echo "For AEO, also spot-check view-source in a browser or use GSC URL inspection."
  exit 1
fi
echo "All GEO public checks passed."
