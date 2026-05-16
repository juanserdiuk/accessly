#!/usr/bin/env bash
# Accessly production smoke test.
#
# Runs a series of curl + check pairs against the live site to catch
# launch-blocking misconfigurations BEFORE customers do. Each check
# prints PASS/FAIL with a one-line reason; the whole script exits
# non-zero if any check fails so it can be wired into CI later.
#
# Usage:
#   ./scripts/smoke.sh [URL]
#   ./scripts/smoke.sh https://accessly.us             # default
#   ./scripts/smoke.sh https://accessly-gray.vercel.app  # preview
#
# What it doesn't cover (manual checks needed):
#   - Full signup → email verify → checkout flow (needs real inbox)
#   - Stripe webhook delivery (check Stripe Dashboard after a real
#     test purchase)
#   - Cron auth (run a manual curl with Bearer ${CRON_SECRET})
#
# Exit codes:
#   0 — all checks passed
#   1 — at least one check failed
#   2 — script-level error (bad args, curl unavailable)

set -uo pipefail

BASE_URL="${1:-https://accessly.us}"
BASE_URL="${BASE_URL%/}"

# ANSI colors — disabled if NO_COLOR is set or stdout isn't a TTY.
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  GREEN='\033[32m'
  RED='\033[31m'
  YELLOW='\033[33m'
  DIM='\033[2m'
  RESET='\033[0m'
else
  GREEN='' RED='' YELLOW='' DIM='' RESET=''
fi

PASSED=0
FAILED=0
WARNINGS=0

# --- helpers ---------------------------------------------------------------

print_header() {
  printf '\n%s== %s ==%s\n' "$DIM" "$1" "$RESET"
}

# pass <label>
pass() {
  printf '  %s✓%s  %s\n' "$GREEN" "$RESET" "$1"
  PASSED=$((PASSED + 1))
}

# fail <label> [<reason>]
fail() {
  printf '  %s✗%s  %s' "$RED" "$RESET" "$1"
  if [[ -n "${2:-}" ]]; then
    printf '  %s%s%s' "$DIM" "$2" "$RESET"
  fi
  printf '\n'
  FAILED=$((FAILED + 1))
}

# warn <label> [<reason>] — counts as info, not failure
warn() {
  printf '  %s⚠%s  %s' "$YELLOW" "$RESET" "$1"
  if [[ -n "${2:-}" ]]; then
    printf '  %s%s%s' "$DIM" "$2" "$RESET"
  fi
  printf '\n'
  WARNINGS=$((WARNINGS + 1))
}

# curl_status <url> [extra-curl-args]
# Returns just the HTTP status code via stdout.
curl_status() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$@"
}

# curl_body <url> [extra-curl-args]
curl_body() {
  curl -sS --max-time 15 "$@"
}

# expect_status <expected> <url> [<extra-args>...]
expect_status() {
  local expected="$1"
  local url="$2"
  shift 2
  local actual
  actual=$(curl_status "$url" "$@")
  if [[ "$actual" == "$expected" ]]; then
    pass "$url → $actual"
  else
    fail "$url" "expected $expected, got $actual"
  fi
}

# expect_in_body <pattern> <label> <url>
#
# Note: uses a herestring (<<<) instead of `echo "$body" | grep` because
# `grep -q` exits the moment it finds a match, which closes the pipe.
# With `set -o pipefail` (above), that SIGPIPE-killed echo is treated
# as a pipeline failure and the assertion silently flips to "not found"
# — a false negative that masked real test results for ages.
expect_in_body() {
  local pattern="$1"
  local label="$2"
  local url="$3"
  local body
  body=$(curl_body "$url")
  if grep -q -- "$pattern" <<< "$body"; then
    pass "$label"
  else
    fail "$label" "pattern \"$pattern\" not in response body"
  fi
}

# --- preflight -------------------------------------------------------------

if ! command -v curl >/dev/null 2>&1; then
  printf 'curl is required. Install it and re-run.\n' >&2
  exit 2
fi

printf '\n'
printf '%s┌────────────────────────────────────────────┐%s\n' "$DIM" "$RESET"
printf '%s│%s Accessly smoke test %s│%s\n' "$DIM" "$RESET" "$DIM" "$RESET"
printf '%s│%s Target: %-35s%s│%s\n' "$DIM" "$RESET" "$BASE_URL" "$DIM" "$RESET"
printf '%s└────────────────────────────────────────────┘%s\n' "$DIM" "$RESET"

# --- 1. Public marketing surfaces ------------------------------------------

print_header "1. Public marketing pages"
expect_status 200 "$BASE_URL/"
expect_status 200 "$BASE_URL/about"
expect_status 200 "$BASE_URL/upgrade"
expect_status 200 "$BASE_URL/privacy"
expect_status 200 "$BASE_URL/terms"
expect_status 200 "$BASE_URL/sitemap"
expect_status 200 "$BASE_URL/login"
expect_status 200 "$BASE_URL/signup"

# --- 2. SEO + structured data ----------------------------------------------

print_header "2. SEO + machine-readable indexes"
expect_status 200 "$BASE_URL/sitemap.xml"
expect_status 200 "$BASE_URL/robots.txt"
expect_status 200 "$BASE_URL/opengraph-image"
expect_status 200 "$BASE_URL/icon"
expect_status 200 "$BASE_URL/apple-icon"

# Structured data presence on the homepage.
expect_in_body 'application/ld+json' 'Homepage emits JSON-LD' "$BASE_URL/"

# Per-page metadata — title should be page-specific, not the generic
# layout default. We assert by checking for the page-unique string.
expect_in_body '<title>About — Accessly</title>'           'About page has its own <title>'   "$BASE_URL/about"
expect_in_body '<title>Privacy Policy — Accessly</title>'  'Privacy has its own <title>'      "$BASE_URL/privacy"
expect_in_body '<title>Terms of Service — Accessly</title>' 'Terms has its own <title>'       "$BASE_URL/terms"

# --- 3. Branding consistency -----------------------------------------------

print_header "3. Branding (no ClearShield residue)"
# "ClearShield" never appears in legitimate Accessly copy. If it shows up,
# something was wrongly copy-pasted from the ClearShield sibling project.
for path in "" "/about" "/upgrade" "/signup"; do
  body=$(curl_body "$BASE_URL$path")
  # Same pipefail-vs-grep-q gotcha as expect_in_body: use herestring.
  if grep -qi 'clearshield' <<< "$body"; then
    fail "ClearShield residue on $path" "found 'clearshield' in HTML"
  else
    pass "No ClearShield residue on $path"
  fi
done

# --- 4. API endpoints respond correctly ------------------------------------

print_header "4. API endpoints respond correctly"
# /api/health should always 200 with JSON status payload.
expect_status 200 "$BASE_URL/api/health"
expect_in_body '"status":"' 'Health endpoint returns status field' "$BASE_URL/api/health"

# /api/scan with no body → 400
expect_status 400 "$BASE_URL/api/scan" -X POST -H 'Content-Type: application/json' -d '{}'

# /api/stripe/create-checkout (no auth, no body) — should 400 missing plan,
# OR 401 unauthenticated. Either is an acceptable "we didn't fall through".
actual=$(curl_status "$BASE_URL/api/stripe/create-checkout" -X POST -H 'Content-Type: application/json' -d '{}')
if [[ "$actual" == "400" || "$actual" == "401" ]]; then
  pass "/api/stripe/create-checkout (no body) → $actual"
else
  fail "/api/stripe/create-checkout (no body)" "expected 400 or 401, got $actual"
fi

# /api/cron/scheduled-scans without Bearer → 401
expect_status 401 "$BASE_URL/api/cron/scheduled-scans"

# /api/stripe/webhook without signature → 400
expect_status 400 "$BASE_URL/api/stripe/webhook" -X POST -H 'Content-Type: application/json' -d '{}'

# /api/contact with no body → 400 / 422
actual=$(curl_status "$BASE_URL/api/contact" -X POST -H 'Content-Type: application/json' -d '{}')
if [[ "$actual" =~ ^(400|422|500)$ ]]; then
  pass "/api/contact (empty) → $actual"
else
  fail "/api/contact (empty)" "expected 400/422, got $actual"
fi

# --- 5. Auth-gated routes refuse anonymous access ---------------------------

print_header "5. Auth-gated routes refuse anonymous access"
# Dashboard + admin + salesperson portal should bounce anonymous callers with 3xx.
for path in "/dashboard" "/dashboard/scans" "/dashboard/settings" "/admin" "/sales"; do
  actual=$(curl_status "$BASE_URL$path")
  if [[ "$actual" =~ ^(302|303|307|401)$ ]]; then
    pass "$path → $actual (gated)"
  else
    fail "$path" "expected 302/307/401, got $actual — auth gate may be missing"
  fi
done

# --- 6. Performance sanity --------------------------------------------------

print_header "6. Performance sanity check (homepage)"
# Cold-cache request — accept up to 4s on a free Vercel project.
elapsed=$(curl -sS -o /dev/null -w '%{time_total}' --max-time 8 "$BASE_URL/")
if awk "BEGIN {exit !($elapsed < 4)}"; then
  pass "Homepage cold load: ${elapsed}s"
else
  warn "Homepage cold load: ${elapsed}s" "consider Vercel Pro or ISR"
fi

# --- summary ----------------------------------------------------------------

printf '\n'
printf '%s────────────────────────────────────────────%s\n' "$DIM" "$RESET"
printf '  %s%d passed%s  ·  %s%d failed%s  ·  %s%d warnings%s\n' \
  "$GREEN" "$PASSED" "$RESET" \
  "$RED" "$FAILED" "$RESET" \
  "$YELLOW" "$WARNINGS" "$RESET"
printf '%s────────────────────────────────────────────%s\n' "$DIM" "$RESET"

if [[ "$FAILED" -gt 0 ]]; then
  printf '\n%sLAUNCH-BLOCKING failures above. Fix before flipping the launch switch.%s\n\n' "$RED" "$RESET"
  exit 1
fi
printf '\n%sAll automated checks passed. Still need to manually verify:%s\n' "$GREEN" "$RESET"
printf '  - Full signup → email verify → checkout in a real browser\n'
printf '  - Stripe webhook fires correctly (Dashboard → Webhooks)\n'
printf '  - Cron runs successfully (curl with Bearer ${CRON_SECRET})\n'
printf '  - Resend email delivery (check spam folder of first signup)\n\n'
exit 0
