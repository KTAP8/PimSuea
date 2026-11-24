#!/usr/bin/env bash
# Verify public GEO surfaces (run after deploy, or locally with MARKETING_ORIGIN).
# Marketing routes are prerendered at build time, so curl sees real body text,
# per-language <html lang>, canonical and hreflang — no JavaScript needed.
set -euo pipefail

ORIGIN="${MARKETING_ORIGIN:-https://pimsuea.com}"
ORIGIN="${ORIGIN%/}"
FAIL=0

fetch() {
  curl -fsSL "${ORIGIN}$1" 2>/dev/null || true
}

check_text() {
  local path="$1"
  local needle="$2"
  local body
  body="$(fetch "$path")"
  if [[ -z "$body" ]]; then
    echo "FAIL ${path} — no response"
    FAIL=1
    return
  fi
  if ! grep -qF -- "$needle" <<<"$body"; then
    echo "FAIL ${path} — missing: ${needle}"
    FAIL=1
    return
  fi
  echo "OK   ${path} — ${needle}"
}

# Prerendered page: right <html lang>, self-canonical, hreflang pair, and an <h1> in the static HTML.
check_page() {
  local path="$1"
  local lang="$2"
  local needle="$3"
  local html
  html="$(fetch "$path")"
  local canonical="https://pimsuea.com${path}"
  [[ "$path" == "/" ]] && canonical="https://pimsuea.com/"

  local problems=()
  grep -q "<html lang=\"${lang}\">" <<<"$html" || problems+=("html lang≠${lang}")
  grep -qF "<link rel=\"canonical\" href=\"${canonical}\"" <<<"$html" || problems+=("canonical≠${canonical}")
  grep -qi 'hreflang="th"' <<<"$html" || problems+=("no hreflang th")
  grep -qi 'hreflang="en"' <<<"$html" || problems+=("no hreflang en")
  grep -q '<h1' <<<"$html" || problems+=("no <h1> (not prerendered?)")
  grep -qF -- "$needle" <<<"$html" || problems+=("missing: ${needle}")

  if [[ ${#problems[@]} -gt 0 ]]; then
    echo "FAIL ${path} — ${problems[*]}"
    FAIL=1
  else
    echo "OK   ${path} (${lang}, prerendered)"
  fi
}

echo "Checking ${ORIGIN} …"

check_text "/robots.txt" "GPTBot"
check_text "/robots.txt" "PerplexityBot"
check_text "/robots.txt" "ClaudeBot"
check_text "/llms.txt" "PimSuea"
check_text "/llms.txt" "custom-shirts-thailand"
check_text "/llms.txt" "English support on LINE"
check_text "/sitemap.xml" "https://pimsuea.com/th/club-and-gift-shirts"
check_text "/sitemap.xml" "https://pimsuea.com/custom-shirts-thailand"

check_page "/" en "Order from 1 piece"
check_page "/th" th "ไม่มีขั้นต่ำ"
check_page "/custom-shirts-thailand" en "English support on LINE"
check_page "/th/custom-shirts-thailand" th "สั่งทำเสื้อในไทย"
check_page "/print-on-demand" en "Print on Demand in Thailand"
check_page "/th/print-on-demand" th "Print on Demand ในประเทศไทย"
check_page "/pricing" en "THB"
check_page "/th/pricing" th "ราคา"
check_page "/vs-printful" en "Printful alternative"
check_page "/th/vs-printful" th "Printful"
check_page "/custom-shirt-no-minimum" en "no minimum"
check_page "/th/custom-shirt-no-minimum" th "ไม่มีขั้นต่ำ"
check_page "/club-and-gift-shirts" en "run clubs"
check_page "/th/club-and-gift-shirts" th "ชมรม"

if [[ "$FAIL" -ne 0 ]]; then
  echo ""
  echo "Some checks failed. If pages show the SPA shell (no <h1>), check vercel.json routes"
  echo "and that the build ran scripts/prerender.mjs."
  exit 1
fi
echo "All GEO public checks passed."
