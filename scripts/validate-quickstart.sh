#!/usr/bin/env bash
# validate-quickstart.sh — Validates the CopyPasteLearn project setup
# Run from repo root: ./scripts/validate-quickstart.sh

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASS++))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAIL++))
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARN++))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CopyPasteLearn — Quickstart Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Prerequisites ──────────────────────────────
echo "── Prerequisites ──"

if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v\([0-9]*\).*/\1/')
  if [[ "$NODE_MAJOR" -ge 20 ]]; then
    pass "Node.js $NODE_VER"
  else
    warn "Node.js $NODE_VER (expected v20+ LTS)"
  fi
else
  fail "Node.js not found"
fi

if command -v pnpm &>/dev/null; then
  pass "pnpm $(pnpm --version)"
else
  fail "pnpm not found — install with: npm install -g pnpm"
fi

if command -v docker &>/dev/null; then
  if docker info &>/dev/null 2>&1; then
    pass "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
  else
    warn "Docker installed but daemon not running"
  fi
else
  warn "Docker not found (required for Lab Service only)"
fi

echo ""

# ── Project Structure ──────────────────────────
echo "── Project Structure ──"

for dir in apps/web services/labs packages/shared; do
  if [[ -d "$dir" ]]; then
    pass "Directory: $dir/"
  else
    fail "Directory missing: $dir/"
  fi
done

for file in pnpm-workspace.yaml turbo.json tsconfig.base.json .nvmrc .gitignore; do
  if [[ -f "$file" ]]; then
    pass "Root config: $file"
  else
    fail "Root config missing: $file"
  fi
done

echo ""

# ── Dependencies ────────────────────────────────
echo "── Dependencies ──"

if [[ -d "node_modules" ]]; then
  pass "Root node_modules installed"
else
  fail "Root node_modules missing — run: pnpm install"
fi

if [[ -d "apps/web/node_modules" ]]; then
  pass "Web app node_modules installed"
else
  fail "Web app node_modules missing — run: pnpm install"
fi

if [[ -d "services/labs/node_modules" ]]; then
  pass "Lab Service node_modules installed"
else
  fail "Lab Service node_modules missing — run: pnpm install"
fi

echo ""

# ── Key Source Files ────────────────────────────
echo "── Key Source Files ──"

WEB_FILES=(
  "apps/web/prisma/schema.prisma"
  "apps/web/src/app/layout.tsx"
  "apps/web/src/app/(marketing)/page.tsx"
  "apps/web/src/app/(marketing)/courses/page.tsx"
  "apps/web/src/app/(marketing)/pricing/page.tsx"
  "apps/web/src/app/(app)/dashboard/page.tsx"
  "apps/web/src/app/(app)/settings/page.tsx"
  "apps/web/src/app/admin/layout.tsx"
  "apps/web/src/lib/db.ts"
  "apps/web/src/lib/auth.ts"
  "apps/web/src/lib/billing.ts"
  "apps/web/src/lib/lab-client.ts"
  "apps/web/src/lib/logger.ts"
  "apps/web/middleware.ts"
  "apps/web/src/server/queries/courses.ts"
  "apps/web/src/server/queries/lessons.ts"
  "apps/web/src/server/queries/dashboard.ts"
  "apps/web/src/server/actions/progress.ts"
  "apps/web/src/server/actions/labs.ts"
  "apps/web/src/server/actions/admin.ts"
  "apps/web/src/components/lab/lab-panel.tsx"
  "apps/web/src/components/lab/terminal-view.tsx"
  "apps/web/src/components/lab/lab-status.tsx"
  "apps/web/src/components/lab/validation-feedback.tsx"
  "apps/web/src/components/lesson/video-player.tsx"
  "apps/web/src/components/course/course-card.tsx"
  "apps/web/src/components/course/paywall.tsx"
  "apps/web/src/components/dashboard/progress-card.tsx"
  "apps/web/src/components/dashboard/continue-prompt.tsx"
  "apps/web/src/components/dashboard/active-lab-card.tsx"
  "apps/web/prisma/seed.ts"
)

LABS_FILES=(
  "services/labs/src/index.ts"
  "services/labs/src/server.ts"
  "services/labs/src/config.ts"
  "services/labs/src/logger.ts"
  "services/labs/src/orchestrator/docker.ts"
  "services/labs/src/orchestrator/interface.ts"
  "services/labs/src/orchestrator/cleanup.ts"
  "services/labs/src/compiler/parser.ts"
  "services/labs/src/compiler/schema.ts"
  "services/labs/src/compiler/types.ts"
  "services/labs/src/validator/runner.ts"
  "services/labs/src/validator/sanitizer.ts"
  "services/labs/src/validator/types.ts"
  "services/labs/src/api/sessions.ts"
  "services/labs/src/api/events.ts"
  "services/labs/src/api/terminal.ts"
  "services/labs/src/api/validate.ts"
)

SHARED_FILES=(
  "packages/shared/src/index.ts"
  "packages/shared/src/types/lab.ts"
  "packages/shared/src/types/course.ts"
  "packages/shared/src/types/api.ts"
  "packages/shared/src/schemas/api.ts"
  "packages/shared/src/constants.ts"
)

FILE_COUNT=0
FILE_MISSING=0

for f in "${WEB_FILES[@]}" "${LABS_FILES[@]}" "${SHARED_FILES[@]}"; do
  if [[ -f "$f" ]]; then
    ((FILE_COUNT++))
  else
    fail "Missing: $f"
    ((FILE_MISSING++))
  fi
done

if [[ $FILE_MISSING -eq 0 ]]; then
  pass "All $FILE_COUNT source files present"
else
  fail "$FILE_MISSING of $((FILE_COUNT + FILE_MISSING)) files missing"
fi

echo ""

# ── Environment Files ───────────────────────────
echo "── Environment ──"

for env in apps/web/.env.example services/labs/.env.example; do
  if [[ -f "$env" ]]; then
    pass "Template: $env"
  else
    fail "Template missing: $env"
  fi
done

if [[ -f "apps/web/.env.local" ]]; then
  pass "Web .env.local configured"
else
  warn "apps/web/.env.local missing — copy from .env.example"
fi

if [[ -f "services/labs/.env.local" ]]; then
  pass "Lab Service .env.local configured"
else
  warn "services/labs/.env.local missing — copy from .env.example"
fi

echo ""

# ── Prisma ──────────────────────────────────────
echo "── Prisma ──"

if [[ -f "apps/web/prisma/schema.prisma" ]]; then
  pass "Prisma schema exists"
else
  fail "Prisma schema missing"
fi

if [[ -d "apps/web/node_modules/.prisma/client" ]]; then
  pass "Prisma client generated"
else
  warn "Prisma client not generated — run: cd apps/web && pnpm prisma generate"
fi

echo ""

# ── Summary ─────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Passed: $PASS${NC}  |  ${RED}Failed: $FAIL${NC}  |  ${YELLOW}Warnings: $WARN${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "Fix the failures above, then re-run this script."
  exit 1
else
  echo ""
  echo "Project setup looks good! Follow quickstart.md to configure env vars and start the servers."
  exit 0
fi
