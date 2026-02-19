# Implementation Plan: CopyPasteLearn MVP Platform

**Branch**: `001-mvp-platform` | **Date**: 2026-02-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-mvp-platform/spec.md`

## Summary

Build a full-stack e-learning platform combining video courses (streamed via Mux) with ephemeral interactive labs (accessed via a Lab Service API). The web application is a Next.js App Router monorepo with Clerk auth, Clerk Billing + Stripe subscriptions, Prisma + Postgres persistence, and a clean integration boundary to an independent Lab Service. The Lab Service provisions isolated Docker containers, streams terminal I/O over WebSocket, and runs deterministic validations returning structured feedback. The MVP ships with 2–3 courses, 3–5 labs, a single subscription plan, and a comfort-first UI built on shadcn/ui.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 20 LTS  
**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Prisma 5+, Tailwind CSS 3+, shadcn/ui, @clerk/nextjs, @mux/mux-player-react, xterm.js (terminal UI)  
**Storage**: Managed PostgreSQL (Neon or Supabase)  
**Testing**: Vitest (unit), Playwright (E2E), axe-core (accessibility)  
**Target Platform**: Web (modern browsers); Vercel for deployment  
**Project Type**: Web application (monorepo: apps/web + services/labs + packages/shared)  
**Performance Goals**: Catalog pages < 2s LCP; lesson page resume < 3s; lab provisioning < 60s p95  
**Constraints**: Max 1 concurrent lab per user; 60-minute default lab TTL; WCAG 2.1 Level A  
**Scale/Scope**: 2–3 courses, 3–5 labs, low initial user count; designed to scale labs independently

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Evidence |
|---|-----------|--------|----------|
| I | Comfort-First Learning UX | ✅ PASS | shadcn/ui component library; skeleton loading; one primary action per screen; clear lab status states (FR-016) |
| II | Trust & Safety | ✅ PASS | Default-deny egress; non-privileged containers; hard TTL + janitor (FR-022, FR-047); output sanitization (FR-045); audit logging (FR-046); max 1 concurrent lab (FR-025) |
| III | Ship Fast with Ready Solutions | ✅ PASS | Clerk (auth), Clerk Billing + Stripe (billing), Mux (video), Vercel (hosting), managed Postgres (storage); no custom identity or billing |
| IV | Deterministic Labs | ✅ PASS | Pre-baked images; versioned lab definitions (FR-043); structured validation with pass/fail + hints (FR-019); determinism tested (SC-003) |
| V | Clean Integration Boundaries | ✅ PASS | Web app accesses labs exclusively via Lab Service API; SSE for status, WebSocket for terminal; separate domain modules: auth, billing, courses, labs |

**Security Requirements**: All 9 security requirements addressed in FR-022 through FR-047 and Lab Service design.

**Definition of Done gates**: Security ✅ | UX states ✅ | Observability ✅ | Testing ✅ | Documentation ✅

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-platform/
├── plan.md              # This file
├── research.md          # Phase 0: technology research & decisions
├── data-model.md        # Phase 1: Prisma schema & entity relationships
├── quickstart.md        # Phase 1: local development setup guide
├── contracts/           # Phase 1: API contracts
│   ├── lab-service-api.md
│   └── web-api-routes.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/
└── web/                          # Next.js App Router application
    ├── src/
    │   ├── app/                  # App Router pages & layouts
    │   │   ├── (marketing)/      # Public pages: home, pricing, catalog
    │   │   ├── (app)/            # Authenticated pages: dashboard, lessons, labs
    │   │   ├── admin/            # Admin: course & lab authoring
    │   │   ├── api/              # Route handlers (webhooks, progress, etc.)
    │   │   └── layout.tsx        # Root layout with Clerk provider
    │   ├── components/           # Shared UI components (shadcn/ui based)
    │   │   ├── ui/               # shadcn/ui primitives
    │   │   ├── course/           # Course card, catalog, detail
    │   │   ├── lesson/           # Video player, transcript, snippets
    │   │   ├── lab/              # Lab panel, terminal, validation feedback
    │   │   └── dashboard/        # Progress cards, resume prompt
    │   ├── lib/                  # Shared utilities
    │   │   ├── db.ts             # Prisma client singleton
    │   │   ├── auth.ts           # Clerk auth helpers & guards
    │   │   ├── billing.ts        # Subscription check helpers
    │   │   ├── lab-client.ts     # Typed Lab Service API client
    │   │   └── utils.ts          # General helpers
    │   ├── server/               # Server actions & data loaders
    │   │   ├── actions/          # Server actions (progress, lab launch, admin)
    │   │   └── queries/          # Data fetching functions
    │   └── types/                # Shared TypeScript types (re-exports from packages/shared)
    ├── prisma/
    │   ├── schema.prisma         # Database schema
    │   └── migrations/           # Prisma migrations
    ├── public/                   # Static assets
    ├── tests/
    │   ├── unit/                 # Vitest unit tests
    │   ├── e2e/                  # Playwright E2E tests
    │   └── a11y/                 # axe-core accessibility tests
    ├── tailwind.config.ts
    ├── next.config.ts
    └── package.json

services/
└── labs/                         # Lab Service (standalone Node.js service)
    ├── src/
    │   ├── api/                  # HTTP + WebSocket API handlers
    │   │   ├── routes.ts         # Express/Fastify route definitions
    │   │   ├── sessions.ts       # Create, get, destroy session handlers
    │   │   ├── terminal.ts       # WebSocket terminal streaming
    │   │   ├── events.ts         # SSE event stream
    │   │   └── validate.ts       # Validation endpoint
    │   ├── orchestrator/         # Container lifecycle management
    │   │   ├── docker.ts         # Docker provider (MVP)
    │   │   ├── interface.ts      # Provider interface (Docker/K8s swappable)
    │   │   └── cleanup.ts        # Janitor / TTL enforcement
    │   ├── compiler/             # Lab definition compiler
    │   │   ├── parser.ts         # YAML → internal plan
    │   │   ├── schema.ts         # YAML schema validation (Zod)
    │   │   └── types.ts          # Compiled plan types
    │   ├── validator/            # Validation framework
    │   │   ├── runner.ts         # Execute checks inside sandbox
    │   │   ├── sanitizer.ts      # Output sanitization
    │   │   └── types.ts          # Validation result types
    │   ├── auth/                 # Request authentication middleware
    │   ├── config.ts             # Environment & defaults
    │   └── logger.ts             # Structured logging with correlation IDs
    ├── tests/
    │   ├── unit/                 # Schema validation, compiler, sanitizer
    │   └── integration/          # Full lifecycle: create → provision → validate → teardown
    └── package.json

packages/
└── shared/                       # Shared types, schemas, API client
    ├── src/
    │   ├── types/                # Shared TypeScript interfaces
    │   │   ├── lab.ts            # Lab session, attempt, status types
    │   │   ├── course.ts         # Course, lesson types
    │   │   └── api.ts            # API request/response shapes
    │   ├── schemas/              # Zod schemas for validation
    │   │   ├── lab-definition.ts # Lab YAML schema
    │   │   └── api.ts            # API payload schemas
    │   └── constants.ts          # Shared constants (TTL, limits, statuses)
    └── package.json
```

**Structure Decision**: Monorepo with three packages. `apps/web` is the Next.js web application. `services/labs` is the standalone Lab Service with its own HTTP/WebSocket API, Docker orchestrator, and validation framework. `packages/shared` contains TypeScript types, Zod schemas, and constants shared between web and labs. The web app communicates with the Lab Service exclusively via `lib/lab-client.ts` using the types from `packages/shared`. This enforces Constitution Principle V (Clean Integration Boundaries).

## Key Architecture Decisions

### AD-001: Single-host Docker runner for MVP labs

The Lab Service uses Docker (via Dockerode) on a single VM to provision ephemeral containers. Each lab session maps to one container created from a pre-baked image. The orchestrator interface (`orchestrator/interface.ts`) is abstract so a Kubernetes provider can replace Docker later without changing the API layer.

**Rationale**: Fastest path to ship. A single Docker host is simple to operate, debug, and monitor. Kubernetes adds operational complexity (cluster management, networking policies) that is unnecessary for the initial 3–5 labs and low user count. The abstract interface preserves the upgrade path.

**Tradeoff**: Vertical scaling limit on the Docker host; no automatic failover. Acceptable for MVP scale.

### AD-002: SSE for lab status, WebSocket for terminal I/O

Lab status updates (provisioning → ready → running → validating → completed) are streamed from the Lab Service to the web app via Server-Sent Events (SSE). Terminal I/O is streamed over a WebSocket connection to a dedicated endpoint. The web app proxies or connects the learner's browser to these streams.

**Rationale**: SSE is simpler than WebSocket for unidirectional status events and works well with HTTP/2 and Vercel's edge network. WebSocket is necessary for bidirectional terminal I/O. Using both avoids over-engineering (full WebSocket for simple status) while meeting the interactive terminal requirement.

### AD-003: Lab definitions as versioned YAML

Lab content is authored as YAML files with a strict Zod-validated schema. The Lab Compiler parses YAML into an executable plan (steps, checks, environment config). Compiled plans are stored alongside the version. The admin UI in the web app provides a YAML editor for lab authoring (MVP); a visual builder can be added later.

**Rationale**: YAML is human-readable, diffable, and versionable in git. A strict schema (validated at compile time, not runtime) prevents malformed lab definitions from reaching production. This satisfies Constitution Principle IV (Deterministic Labs).

### AD-004: Clerk as subscription authority

Clerk Billing manages the subscription lifecycle. The web app checks `clerkUserId` subscription status via Clerk's SDK for gating decisions. Minimal subscription metadata (plan, status, period dates) is synced to the local Postgres database via webhooks for analytics and fast cache reads. Clerk remains the source of truth.

**Rationale**: Avoids building custom billing logic. Clerk Billing + Stripe handles payment, invoicing, plan management, and webhook events. Local sync is only for read performance and analytics — never for authoritative gating if the cache is stale (fall back to Clerk SDK call).

### AD-005: xterm.js for browser terminal

The lab terminal UI uses xterm.js connected via WebSocket to the Lab Service's terminal streaming endpoint, which attaches to the running container's shell. Output passes through the sanitization layer before reaching the browser.

**Rationale**: xterm.js is the standard browser terminal emulator (used by VS Code, Theia, etc.). It handles ANSI escape codes, resize events, and provides a familiar experience for IT automation learners.

## Complexity Tracking

No constitution violations detected. No complexity justifications needed.

## Dependency Summary

| Category | Package | Purpose |
|----------|---------|---------|
| Framework | next, react, react-dom | App Router web application |
| UI | tailwindcss, @shadcn/ui components, class-variance-authority, clsx | Styling & component library |
| Auth | @clerk/nextjs | Authentication & user management |
| Billing | @clerk/nextjs (billing), stripe (webhooks) | Subscription management |
| Video | @mux/mux-player-react | Video player component |
| Database | prisma, @prisma/client | ORM & database access |
| Terminal | xterm, xterm-addon-fit, xterm-addon-web-links | Browser terminal emulator |
| Validation | zod | Schema validation (API, lab definitions) |
| Lab Service | express or fastify, dockerode, ws | Lab API server, container management, WebSocket |
| Testing | vitest, playwright, axe-core | Unit, E2E, accessibility tests |
| Logging | pino | Structured logging with correlation IDs |
