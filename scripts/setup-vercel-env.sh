#!/usr/bin/env bash
# scripts/setup-vercel-env.sh
#
# Adds the commerce env vars this repo needs to Vercel.
# Idempotent: re-running prompts to overwrite existing vars.
#
# Usage:
#   scripts/setup-vercel-env.sh                  # production scope
#   TARGET=preview scripts/setup-vercel-env.sh   # preview scope
#   TARGET=development scripts/setup-vercel-env.sh
#
# Requires: vercel CLI logged in (`vercel login`) and linked to this
# project (`vercel link`).
#
# Behavior:
#   - Variables with a sensible default are added non-interactively.
#   - Secrets are prompted (read from stdin, hidden).
#   - Empty input on a secret prompt skips that var.

set -euo pipefail

TARGET="${TARGET:-production}"

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not found. Install with: npm i -g vercel" >&2
  exit 1
fi

# Generate a 32-byte hex CRON_SECRET if user doesn't provide one.
gen_cron_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | xxd -p -c 64
  fi
}

# add_default <name> <value>
add_default() {
  local name="$1"
  local value="$2"
  echo ""
  echo "→ ${name} = ${value}"
  printf '%s' "$value" | vercel env add "$name" "$TARGET" 2>&1 | sed 's/^/   /' || {
    echo "   (already exists or skipped)"
  }
}

# add_secret <name> <description> [optional]
add_secret() {
  local name="$1"
  local desc="$2"
  local optional="${3:-}"
  echo ""
  if [[ "$optional" == "optional" ]]; then
    echo "→ ${name} (optional) — ${desc}"
  else
    echo "→ ${name} — ${desc}"
  fi
  printf "   value (hidden, empty=skip): "
  IFS= read -rs value
  echo
  if [[ -z "$value" ]]; then
    echo "   skipped"
    return 0
  fi
  printf '%s' "$value" | vercel env add "$name" "$TARGET" 2>&1 | sed 's/^/   /' || {
    echo "   (already exists — remove first with: vercel env rm $name $TARGET)"
  }
}

echo "=================================================================="
echo "Vercel commerce env setup — target: $TARGET"
echo "=================================================================="
echo "Existing vars are NOT overwritten. Remove first if you want to"
echo "replace one:  vercel env rm <NAME> $TARGET"
echo ""

# ─── Defaults (safe to set without prompts) ──────────────────────────
add_default NEXT_PUBLIC_APP_URL          "https://www.copypastelearn.com"
add_default COMMERCE_MERCHANT_COUNTRY    "NL"
add_default COMMERCE_SUPPORT_EMAIL       "support@copypastelearn.com"
add_default ENABLE_STRIPE_SPT            "false"
add_default LOG_LEVEL                    "info"

# CRON_SECRET — auto-generate if not supplied
echo ""
echo "→ CRON_SECRET — auth token for Vercel Cron handlers"
printf "   paste existing or press Enter to auto-generate: "
IFS= read -rs cron_secret
echo
if [[ -z "$cron_secret" ]]; then
  cron_secret="$(gen_cron_secret)"
  echo "   generated: ${cron_secret}"
  echo "   (save this — it is only shown once)"
fi
printf '%s' "$cron_secret" | vercel env add CRON_SECRET "$TARGET" 2>&1 | sed 's/^/   /' || true

# ─── Secrets (prompt) ────────────────────────────────────────────────
add_secret NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
  "Stripe live publishable key (pk_live_...)"

add_secret RESEND_API_KEY \
  "Resend API key (re_...)"

add_secret COMMERCE_S3_REGION \
  "AWS region, e.g. eu-central-1"

add_secret COMMERCE_S3_BUCKET \
  "Private S3 bucket name (block-all-public-access ON)"

add_secret COMMERCE_S3_ACCESS_KEY_ID \
  "S3 access key id"

add_secret COMMERCE_S3_SECRET_ACCESS_KEY \
  "S3 secret access key"

add_secret COMMERCE_S3_ENDPOINT \
  "Optional: R2/MinIO endpoint URL — leave empty for AWS S3" optional

add_secret UPSTASH_REDIS_REST_URL \
  "Upstash Redis REST URL (https://...upstash.io)"

add_secret UPSTASH_REDIS_REST_TOKEN \
  "Upstash Redis REST token"

add_secret NEXT_PUBLIC_ENABLE_ASSISTANT \
  "Optional: 'true' to enable on-site assistant" optional

echo ""
echo "=================================================================="
echo "Done. Verify with:  vercel env ls $TARGET"
echo ""
echo "Reminders:"
echo "  • STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are already set."
echo "    Confirm STRIPE_SECRET_KEY is a live (sk_live_...) key for prod."
echo "  • Confirm STRIPE_WEBHOOK_SECRET matches the commerce webhook"
echo "    endpoint /api/webhooks/stripe (not the legacy subscription one)."
echo "  • Trigger a redeploy to pick up the new vars."
echo "=================================================================="
