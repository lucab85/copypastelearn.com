# Quickstart: CopyPasteLearn MVP Platform

**Branch**: `001-mvp-platform` | **Date**: 2026-02-19

## Prerequisites

- **Node.js** 20 LTS (`node --version` → v20.x)
- **pnpm** 8+ (`pnpm --version` → 8.x or 9.x) — monorepo package manager
- **Docker** 24+ (`docker --version`) — required for Lab Service
- **PostgreSQL** — local instance or managed (connection string required)

## 1. Clone & Install

```bash
git clone <repo-url> copypastelearn
cd copypastelearn
pnpm install
```

## 2. Environment Variables

Copy the example env files and fill in your values:

```bash
# Web app
cp apps/web/.env.example apps/web/.env.local

# Lab Service
cp services/labs/.env.example services/labs/.env.local
```

### apps/web/.env.local

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/copypastelearn?schema=public"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Mux
MUX_TOKEN_ID="..."
MUX_TOKEN_SECRET="..."

# Lab Service
LAB_SERVICE_URL="http://localhost:4000"
LAB_SERVICE_API_KEY="dev-lab-service-key"

# Stripe (webhook validation)
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### services/labs/.env.local

```env
# Server
PORT=4000
HOST=0.0.0.0

# Auth
LAB_SERVICE_API_KEY="dev-lab-service-key"

# Docker
DOCKER_SOCKET="/var/run/docker.sock"

# Defaults
DEFAULT_TTL_MINUTES=60
MAX_CONCURRENT_SESSIONS_PER_USER=1
SANDBOX_MEMORY_LIMIT="512m"
SANDBOX_CPU_LIMIT="1.0"

# Logging
LOG_LEVEL="debug"
```

## 3. Database Setup

```bash
cd apps/web

# Generate Prisma client
pnpm prisma generate

# Run migrations (creates tables)
pnpm prisma migrate dev --name init

# (Optional) Seed with sample data
pnpm prisma db seed
```

## 4. Start Development Servers

Open two terminals:

### Terminal 1: Web App

```bash
cd apps/web
pnpm dev
```

Web app starts at `http://localhost:3000`.

### Terminal 2: Lab Service

```bash
cd services/labs
pnpm dev
```

Lab Service starts at `http://localhost:4000`.

## 5. Verify Setup

| Check | How | Expected |
|-------|-----|----------|
| Web app loads | Open `http://localhost:3000` | Homepage renders |
| Database connected | Check terminal logs | No connection errors |
| Clerk auth works | Click "Sign In" | Clerk modal appears |
| Lab Service health | `curl http://localhost:4000/health` | `{"status":"ok"}` |
| Docker accessible | `docker ps` (from Lab Service host) | No errors |

## 6. Pull Lab Images (first time)

Pre-pull the lab images so provisioning is fast:

```bash
docker pull copypastelearn/lab-base:latest
# Add more images as labs are created
```

## 7. Common Commands

```bash
# Root (monorepo)
pnpm install                    # Install all dependencies
pnpm -r build                   # Build all packages
pnpm -r test                    # Run all tests
pnpm -r lint                    # Lint all packages

# Web app
cd apps/web
pnpm dev                        # Start dev server (port 3000)
pnpm build                      # Production build
pnpm test                       # Run unit tests (Vitest)
pnpm test:e2e                   # Run E2E tests (Playwright)
pnpm test:a11y                  # Run accessibility tests
pnpm prisma studio              # Open Prisma Studio (DB GUI)
pnpm prisma migrate dev         # Run pending migrations

# Lab Service
cd services/labs
pnpm dev                        # Start dev server (port 4000)
pnpm build                      # Production build
pnpm test                       # Run unit tests
pnpm test:integration           # Run integration tests (requires Docker)

# Shared package
cd packages/shared
pnpm build                      # Build shared types/schemas
```

## 8. Project Structure Quick Reference

```text
copypastelearn/
├── apps/web/           → Next.js web application
├── services/labs/      → Lab Service (Fastify + Docker)
├── packages/shared/    → Shared types, schemas, constants
├── pnpm-workspace.yaml → Workspace configuration
└── turbo.json          → (optional) Turborepo build config
```

## 9. Troubleshooting

| Problem | Solution |
|---------|----------|
| Prisma client not found | Run `pnpm prisma generate` in `apps/web` |
| Docker socket permission denied | Add your user to the `docker` group or run Lab Service with `sudo` |
| Port 3000 already in use | Kill the process: `lsof -ti:3000 \| xargs kill` |
| Clerk keys not working | Ensure you're using test keys (prefix `pk_test_`, `sk_test_`) |
| Lab provisioning timeout | Check Docker daemon is running: `docker info` |
