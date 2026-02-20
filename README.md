# CopyPasteLearn

Video courses with integrated interactive labs. Learners watch video lessons and practice in real, isolated lab environments — all in one platform.

## Architecture

```
copypastelearn.com/
├── apps/web          # Next.js 15 frontend (App Router)
├── services/labs     # Fastify lab orchestration service
├── packages/shared   # Shared types, schemas & constants
├── specs/            # Feature specifications
└── scripts/          # Utility scripts
```

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 18, Tailwind CSS, Radix UI |
| Auth | Clerk |
| Database | PostgreSQL (Supabase) via Prisma |
| Video | Mux (signed playback) |
| Payments | Stripe (subscriptions) |
| Labs | Docker containers orchestrated by Fastify service |
| Monorepo | pnpm workspaces + Turborepo |

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker** (for lab environments — [Colima](https://github.com/abiosoft/colima) or Docker Desktop on macOS)
- **PostgreSQL** database (or a [Supabase](https://supabase.com) project)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in the required values:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Your PostgreSQL / Supabase connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard → API Keys](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | [Mux Dashboard → Settings → Signing Keys](https://dashboard.mux.com/settings/signing-keys) |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Product Catalog → Price ID |

### 3. Set up the database

```bash
pnpm db:generate
pnpm db:migrate
```

Optionally seed sample data:

```bash
cd apps/web && pnpm db:seed
```

### 4. Start development

```bash
pnpm dev
```

This starts both the **web app** (http://localhost:3000) and the **lab service** (http://localhost:4000) via Turborepo.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in dev mode |
| `pnpm build` | Production build |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run unit tests |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm clean` | Remove build artifacts and node_modules |

### Web-specific (`apps/web`)

| Command | Description |
|---------|-------------|
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm test:a11y` | Accessibility tests |

## Stripe Webhook Setup

Create a webhook endpoint in the Stripe Dashboard pointing to:

```
https://<your-domain>/api/webhooks/stripe
```

Enable these events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

For local development, use the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Project Structure

### `apps/web`

Next.js frontend with two route groups:

- **`(marketing)/`** — Public pages (home, pricing, courses, blog, about, etc.)
- **`(app)/`** — Authenticated pages (dashboard, course player, labs, settings)
- **`admin/`** — Content management for admins

### `services/labs`

Fastify service that manages Docker-based lab environments:

- **Compiler** — Parses YAML lab definitions into executable steps
- **Orchestrator** — Provisions/destroys Docker containers per session
- **Validator** — Runs deterministic checks and returns structured feedback

### `packages/shared`

Shared TypeScript types, Zod schemas, and constants used across web and lab services.

## License

Private — All rights reserved.
