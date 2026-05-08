# Implementation Plan: CopyPasteLearn Agentic Commerce Platform

**Branch**: `002-agentic-commerce` | **Date**: 2026-05-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-agentic-commerce/spec.md`

## Summary

Add a unified digital-commerce surface to the existing CopyPasteLearn Next.js monorepo so that Open Empower B.V. can sell ebooks, templates, file-based courses, and bundles across its DevOps content portfolio (AnsiblePilot, TerraformPilot, Ansible by Example, Kubernetes Recipes). The launch flow is merchant-owned hosted Stripe Checkout under the existing Dutch operating entity, with idempotent webhook fulfillment, secure short-lived download tokens, and a buyer library. The same catalog and order subsystems back a public product feed (`/feeds/products.json`), a programmatic agent API surface (`/api/agent/*`), and a `/.well-known/ucp` discovery document — designed so future agentic-commerce protocols (ACP, UCP, Stripe Shared Payment Tokens) can plug into the existing payment abstraction without rebuilding catalog, order, tax, library, or admin systems. Implementation reuses Clerk for buyer identity, Prisma + Postgres for persistence, Stripe for hosted payment + tax, and adds private object storage (S3-compatible) for protected files.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20 LTS (matches existing apps/web).
**Primary Dependencies**: Next.js 15 App Router, React 19, Prisma 5+, `stripe` (Node SDK), `@clerk/nextjs` (existing), `zod` (request validation), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (private file storage with presigned GETs), `resend` or `react-email` + a transactional provider (vendor decided in research.md), `@upstash/ratelimit` + Redis (rate limiting on agent + download endpoints).
**Storage**: Managed PostgreSQL (existing Neon/Supabase) for catalog, orders, entitlements, download tokens, audit; S3-compatible private bucket for protected product files; bucket access only via short-lived presigned URLs minted by the download endpoint.
**Testing**: Vitest (unit), Playwright (E2E for checkout + library + agent flows), Stripe CLI for webhook event replay in CI; contract tests for `/feeds/products.json`, `/api/agent/*`, `/.well-known/ucp` validate against JSON Schemas committed under `contracts/`.
**Target Platform**: Web (modern browsers); Vercel hosting. Vertical-domain CTA component is a tiny client-side widget embeddable as a script tag or as a Next.js component on sibling sites.
**Project Type**: Web application (existing Next.js monorepo `apps/web` + `services/labs`); no new service introduced.
**Performance Goals**: Product detail page TTI < 3s p75 mobile (SC-008); checkout-session-create p95 < 1.5s; webhook fulfillment to entitlement+email within 60s p95 of payment confirmation (SC-002); `/feeds/products.json` cacheable, p95 < 500ms cold.
**Constraints**: 99.0% monthly uptime SLO best-effort (SC-016, A13); zero permanent public file URLs (SC-004); 24-hour download-token expiry, 3 downloads/token (FR-025); 100% idempotency on webhook redelivery within 7 days (SC-003); no client-supplied prices (FR-006); seller-of-record = Dutch operating entity (A1).
**Scale/Scope**: Launch with ≤10 products, ≤3 bundles, hundreds of orders/month projected within 90 days; agent + feed endpoints rate-limited to protect against scrapers but designed to scale via CDN cache (feed) and Redis-backed token-bucket (agent).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| # | Principle | Status | Evidence |
|---|-----------|--------|----------|
| I | Comfort-First Learning UX | PASS | One primary action per product page (FR-008); skeleton/loading on success page until webhook fulfillment lands (edge-case: delayed webhook); calm policy summaries inline at checkout. Storefront pages use shadcn/ui components consistent with existing site. |
| II | Trust & Safety | PASS | No raw card handling (FR-016); Stripe webhook signatures verified (FR-019); idempotent fulfillment (FR-020, SC-003); private storage with presigned URLs only (FR-024); short-lived hashed tokens (FR-025); rate limiting on agent + webhook + download endpoints (FR-041, FR-053); admin actions audit-logged (FR-031); no client-supplied prices (FR-006). |
| III | Ship Fast with Ready Solutions | PASS | Stripe Checkout (hosted, PCI-out-of-scope) for payments + Stripe Tax for VAT/OSS; Clerk for buyer email-link sign-in (FR-029) — same identity provider as the rest of the platform; Resend (or similar managed transactional email) for delivery email (FR-021); S3 (or compatible) for private files; Upstash Redis for rate limiting. No custom payment, identity, tax, or storage built. |
| IV | Deterministic Labs | N/A | Feature does not introduce labs. The determinism principle is preserved by analogy: webhook fulfillment is idempotent and deterministic (same Stripe event → same order/entitlement state); price + product validation is server-authoritative. |
| V | Clean Integration Boundaries | PASS | New `commerce` domain module is separate from existing `auth`, `billing` (subscriptions), `courses`, `labs` modules. Catalog & orders persist via Prisma (existing pattern). Agent APIs and feed are thin adapters over the same domain services — no parallel logic. Payment abstraction (FR-042) keeps order/fulfillment ignorant of the specific Stripe flow used. |

**Security Requirements check**: TLS everywhere; Stripe webhook signatures; secrets via Vercel env (no source); rate limiting on agent/feed/download/webhook; audit log on admin and download events; presigned-URL-only file access; no privileged execution introduced; least-privilege Stripe restricted key for server SDK; least-privilege S3 access (signed-URL generation only, no public ACL).

**Definition of Done gates** (forecast): Security PASS | UX states PASS | Observability via existing structured logger + new event log table PASS | Testing per Phase 1 contracts PASS | Documentation: README + ops runbook for refunds, webhook replay, file-version pinning PASS.

**Result**: All applicable principles PASS. No deviations recorded in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-agentic-commerce/
├── plan.md                       # This file
├── research.md                   # Phase 0: vendor decisions & technical research
├── data-model.md                 # Phase 1: Prisma schema additions & entity relationships
├── quickstart.md                 # Phase 1: local development & test-purchase guide
├── contracts/                    # Phase 1: API contracts + JSON Schemas
│   ├── README.md
│   ├── public-storefront-api.md
│   ├── agent-api.md
│   ├── product-feed.md
│   ├── webhooks.md
│   └── schemas/
│       ├── product.schema.json
│       ├── product-feed.schema.json
│       ├── agent-capabilities.schema.json
│       ├── agent-checkout-request.schema.json
│       ├── agent-checkout-response.schema.json
│       ├── ucp-discovery.schema.json
│       └── error.schema.json
└── tasks.md                      # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/
└── web/
    ├── prisma/
    │   ├── schema.prisma                  # EXTEND: + Product, Bundle, ProductFile, Order, OrderItem,
    │   │                                  #         Entitlement, DownloadToken, Refund, AnalyticsEvent,
    │   │                                  #         PolicyDocument
    │   └── migrations/                    # NEW migrations for the above
    ├── src/
    │   ├── app/
    │   │   ├── (marketing)/
    │   │   │   ├── shop/                  # NEW: catalog index w/ brand+category filters
    │   │   │   ├── products/[slug]/       # NEW: product detail page (FR-007, FR-008, FR-010)
    │   │   │   ├── bundles/[slug]/        # NEW: bundle detail page
    │   │   │   ├── checkout/success/      # NEW: post-payment success (FR-007)
    │   │   │   ├── library/               # NEW: buyer library (FR-029, FR-030) — Clerk-protected
    │   │   │   ├── terms/                 # NEW: policy pages (FR-047)
    │   │   │   ├── privacy/
    │   │   │   ├── refund-policy/
    │   │   │   └── digital-delivery-policy/
    │   │   ├── admin/
    │   │   │   ├── products/              # NEW: product/bundle/file CRUD (FR-004, FR-031)
    │   │   │   ├── orders/                # NEW: order lookup + refund (FR-032)
    │   │   │   └── policies/              # NEW: PolicyDocument editor
    │   │   ├── api/
    │   │   │   ├── products/              # NEW: GET list + GET by id (public storefront API)
    │   │   │   ├── checkout/
    │   │   │   │   └── stripe/route.ts    # NEW: POST create checkout session (FR-014)
    │   │   │   ├── webhooks/
    │   │   │   │   └── stripe/route.ts    # NEW: POST webhook handler (FR-019, FR-020)
    │   │   │   ├── orders/[id]/route.ts   # NEW: GET order status (buyer-scoped)
    │   │   │   ├── download/[token]/route.ts  # NEW: GET — mints presigned URL (FR-024..FR-026)
    │   │   │   ├── agent/
    │   │   │   │   ├── capabilities/route.ts          # FR-037
    │   │   │   │   ├── products/route.ts              # FR-038
    │   │   │   │   ├── products/[id]/route.ts
    │   │   │   │   ├── checkout/route.ts              # FR-038, FR-043
    │   │   │   │   ├── orders/[id]/route.ts
    │   │   │   │   └── refund-request/route.ts
    │   │   │   └── .well-known/
    │   │   │       └── ucp/route.ts                   # FR-039
    │   │   └── feeds/
    │   │       └── products.json/route.ts             # FR-036 (cacheable feed)
    │   ├── components/
    │   │   └── commerce/
    │   │       ├── ProductCard.tsx
    │   │       ├── ProductDetail.tsx
    │   │       ├── BuyButton.tsx
    │   │       ├── BundleDetail.tsx
    │   │       ├── PolicySummary.tsx
    │   │       ├── LibraryItem.tsx
    │   │       └── ArticleCTA.tsx                     # FR-011 — embeddable on sibling domains
    │   ├── lib/
    │   │   ├── commerce/
    │   │   │   ├── catalog.ts             # product/bundle queries; canonical URL helpers
    │   │   │   ├── pricing.ts             # server-side price resolution (FR-006)
    │   │   │   ├── attribution.ts         # source-domain + UTM helpers (FR-018)
    │   │   │   ├── feed.ts                # serialize active products → feed JSON
    │   │   │   └── policies.ts            # PolicyDocument loader
    │   │   ├── payments/
    │   │   │   ├── provider.ts            # PaymentProvider abstraction (FR-042)
    │   │   │   ├── stripe-checkout.ts     # Stripe Checkout implementation
    │   │   │   ├── stripe-spt.ts          # SPT impl, gated by feature flag (FR-043, FR-044)
    │   │   │   └── webhook-router.ts      # Stripe → fulfillment dispatcher
    │   │   ├── fulfillment/
    │   │   │   ├── fulfill.ts             # idempotent: order + entitlement + email + token (FR-021)
    │   │   │   ├── refund.ts              # refund → entitlement state (FR-023)
    │   │   │   └── email.ts               # transactional email
    │   │   ├── delivery/
    │   │   │   ├── tokens.ts              # mint/hash/verify download tokens (FR-024..FR-026)
    │   │   │   └── storage.ts             # S3 presigned URL helper
    │   │   ├── ratelimit.ts               # Upstash-backed limiter (FR-041, FR-053)
    │   │   ├── analytics.ts               # event emitter (FR-049)
    │   │   └── flags.ts                   # ENABLE_STRIPE_SPT etc. (FR-043)
    │   └── server/
    │       ├── actions/
    │       │   ├── checkout.ts            # server action wrappers
    │       │   └── admin/                 # publish, refund, file upload (audit-logged)
    │       └── queries/
    │           ├── catalog.ts
    │           ├── orders.ts
    │           └── library.ts
    └── tests/
        ├── unit/
        │   ├── pricing.test.ts            # server-side price authority
        │   ├── tokens.test.ts             # token mint/verify/expire/revoke
        │   ├── fulfillment.idempotency.test.ts
        │   └── feed.serializer.test.ts
        ├── contract/                      # NEW: validates JSON Schemas under contracts/schemas
        │   ├── feed.contract.test.ts
        │   ├── agent-capabilities.contract.test.ts
        │   ├── agent-products.contract.test.ts
        │   ├── agent-checkout.contract.test.ts
        │   └── ucp.contract.test.ts
        └── e2e/
            ├── purchase-happy-path.spec.ts
            ├── library-recovery.spec.ts
            ├── download-expiry.spec.ts
            ├── refund-flow.spec.ts
            └── agent-checkout.spec.ts

packages/
└── shared/
    └── src/
        └── schemas/
            └── commerce/                  # NEW: Zod schemas re-exported from contracts/schemas
                ├── product.ts
                ├── feed.ts
                └── agent.ts
```

**Structure Decision**: Reuse the existing Next.js monorepo. All commerce code lives in `apps/web` under a new `commerce` domain (`src/lib/commerce`, `src/lib/payments`, `src/lib/fulfillment`, `src/lib/delivery`) plus dedicated routes under `src/app/(marketing)`, `src/app/admin`, and `src/app/api`. No new service is introduced; the labs service (`services/labs`) is unrelated and untouched. The `ArticleCTA` component is exposed as both a React component (for sibling Next.js sites) and a static script-tag widget (for sibling content sites that aren't React) to satisfy FR-011/FR-012 across the four vertical domains. Shared Zod schemas live in `packages/shared` so contracts stay aligned between server and any client/agent SDK we may publish later.

## Complexity Tracking

> No Constitution violations. Section intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | (none)     | (none)                               |
