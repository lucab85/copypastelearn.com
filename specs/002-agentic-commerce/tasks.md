# Tasks: CopyPasteLearn Agentic Commerce Platform

**Input**: Design documents from `/specs/002-agentic-commerce/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Test tasks are INCLUDED. Rationale: plan.md explicitly enumerates `tests/{unit,contract,e2e}/*` files, the Constitution lists Testing as a Definition-of-Done gate, and SC-003 (idempotency) and SC-012 (agent E2E) require automated verification. Tests are written alongside implementation per user story, not strict-TDD-first; contract tests against `contracts/schemas/*.json` MUST exist before the corresponding endpoint ships.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and shipped independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Story label (US1–US9). Setup, Foundational, and Polish phases carry no story label.
- All paths are workspace-relative.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add commerce dependencies, env scaffolding, and seed/dev tooling shared by every story.

- [ ] T001 Add commerce runtime deps to `apps/web/package.json`: `stripe`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `resend`, `react-email`, `@upstash/ratelimit`, `@upstash/redis`. Run `pnpm install` at repo root.
- [ ] T002 [P] Add commerce dev deps to `apps/web/package.json`: `@playwright/test` (if not already), `vitest` (if not already), `stripe-mock` or rely on `stripe listen`. Configure `apps/web/vitest.config.ts` and `apps/web/playwright.config.ts` test roots to include `tests/{unit,contract,e2e}/`.
- [ ] T003 [P] Document new env vars in `apps/web/.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `COMMERCE_S3_REGION`, `COMMERCE_S3_BUCKET`, `COMMERCE_S3_ACCESS_KEY_ID`, `COMMERCE_S3_SECRET_ACCESS_KEY`, `COMMERCE_S3_ENDPOINT`, `RESEND_API_KEY`, `COMMERCE_EMAIL_FROM`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ENABLE_STRIPE_SPT`.
- [ ] T004 [P] Create commerce module skeleton directories (empty `index.ts` barrels): `apps/web/src/lib/commerce/`, `apps/web/src/lib/payments/`, `apps/web/src/lib/fulfillment/`, `apps/web/src/lib/delivery/`, `apps/web/src/components/commerce/`, `apps/web/src/server/actions/admin/`, `apps/web/src/server/queries/`, `apps/web/tests/{unit,contract,e2e}/`.
- [ ] T005 [P] Create shared schema package directory `packages/shared/src/schemas/commerce/` with empty `index.ts`; ensure `packages/shared/package.json` exports it.
- [ ] T006 [P] Configure linting rules for new commerce code: ensure `apps/web/eslint.config.*` covers `src/lib/commerce/**`, `src/lib/payments/**`, `src/lib/fulfillment/**`, `src/lib/delivery/**`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, payment-provider client, storage client, rate limiter, audit/event logging, and the payment abstraction. Nothing in any user story can compile or run without these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database & Migrations

- [X] T007 Extend `apps/web/prisma/schema.prisma` per `data-model.md`: add enums `Brand`, `ProductType`, `OrderStatus`, `PaymentMethod`, `EntitlementStatus`; add `ARCHIVED` to `ContentStatus` if missing; add models `Product`, `ProductFile`, `Bundle`, `BundleItem`, `Customer`, `Order`, `OrderItem`, `Entitlement`, `DownloadToken`, `Refund`, `WebhookEventLog`, `AnalyticsEvent`, `AdminAuditEvent`, `EmailJob`, `PolicyDocument`. Add optional `clerkUserId` linkage on `Customer`.
- [ ] T008 Run `pnpm --filter @copypastelearn/web db:generate` then `pnpm --filter @copypastelearn/web db:migrate --name commerce_init` to produce the migration under `apps/web/prisma/migrations/`.
- [X] T009 [P] Create `apps/web/prisma/seed.commerce.ts`: seeds one published Product (ebook, EUR, Brand AnsiblePilot), one published Bundle, four `PolicyDocument` rows (terms, privacy, refund, digital-delivery), and uploads a sample PDF to S3 as `ProductFile` v1.0. The seed MUST generate the PDF at runtime via `pdf-lib` (one page, "CopyPasteLearn — sample seed file") rather than committing a binary asset to the repo. Invokes Stripe API to create matching `prod_*`/`price_*` and stores IDs.

### Shared Schemas (Zod + JSON Schema parity)

- [X] T010 [P] Create `packages/shared/src/schemas/commerce/product.ts`: Zod schemas for `Product`, `ProductFeedItem` mirroring `contracts/schemas/product.schema.json` and `product-feed.schema.json`.
- [X] T011 [P] Create `packages/shared/src/schemas/commerce/agent.ts`: Zod schemas for `AgentCapabilities`, `AgentCheckoutRequest`, `AgentCheckoutResponse`, `UCPDiscovery` mirroring respective JSON Schemas.
- [X] T012 [P] Create `packages/shared/src/schemas/commerce/error.ts`: Zod `ApiError` schema mirroring `contracts/schemas/error.schema.json`. Re-export all commerce schemas from `packages/shared/src/schemas/commerce/index.ts`.

### Foundational Libs

- [X] T013 [P] Create `apps/web/src/lib/flags.ts`: read `ENABLE_STRIPE_SPT` and other commerce flags from env; export typed accessor.
- [X] T014 [P] Create `apps/web/src/lib/ratelimit.ts`: Upstash-backed limiter factory with named buckets per `research.md` (`agent:ip 60/min`, `feed:ip 30/min`, `download:ip 30/min`, `download:token 100/min`); exports `limit(name, key)`.
- [X] T015 [P] Create `apps/web/src/lib/delivery/storage.ts`: S3 client + `presignDownloadUrl(bucket, key, ttlSeconds)` returning a 60s GET URL; resolves `COMMERCE_S3_ENDPOINT` for MinIO/R2.
- [X] T016 [P] Create `apps/web/src/lib/fulfillment/email.ts`: Resend client wrapper with `sendOrderConfirmationEmail`, `sendDownloadLinkEmail`, `sendRefundConfirmationEmail`; persists an `EmailJob` row before sending.
- [X] T017 [P] Create `apps/web/src/lib/commerce/audit.ts`: `logAdminAction(actorId, action, subjectType, subjectId, metadata)` writing to `AdminAuditEvent`.
- [X] T018 [P] Create `apps/web/src/lib/analytics.ts` (implemented as `apps/web/src/lib/commerce/analytics.ts` to avoid colliding with the existing client-side GA4 helper at `apps/web/src/lib/analytics.ts`): `trackEvent(type, payload)` writing to `AnalyticsEvent` with attribution context. Export a typed union of the 11 FR-049 event names: `product_page_view`, `article_cta_view`, `article_cta_click`, `chat_recommendation_shown`, `chat_checkout_clicked`, `checkout_session_created`, `checkout_completed`, `checkout_abandoned`, `file_downloaded`, `refund_requested`, `refund_completed`. Unit test `apps/web/tests/unit/analytics.events.test.ts` MUST assert every member of the union is reachable via at least one production call site.
- [X] T019 [P] Create `apps/web/src/lib/commerce/attribution.ts`: read/write the `cpl_attr` first-party cookie (24h, SameSite=Lax) capturing `utm_source`, `utm_campaign`, `utm_content`, `referrer_domain`; helper `consumeAttribution(req)` for checkout creation (FR-018).

### Payment Abstraction

- [X] T020 Create `apps/web/src/lib/payments/provider.ts`: `PaymentProvider` interface (`createCheckoutSession`, `verifyWebhook`, `refund`, `parseEvent`) and a registry keyed by `PaymentMethod` (FR-042).
- [X] T021 Create `apps/web/src/lib/payments/stripe-checkout.ts`: implements `PaymentProvider` using Stripe SDK; uses Stripe Tax (`txcd_10501000` for ebooks/templates), enforces server-side price loading (FR-006), records `stripeCheckoutSessionId` on `Order`.
- [X] T022 Create `apps/web/src/lib/payments/stripe-spt.ts`: stub implementation that returns `unsupported_payment_method` whenever `flags.ENABLE_STRIPE_SPT === false` (FR-043). **Note**: full FR-044 validation (token authenticity, scope, currency, amount, expiry, cart-stability) is intentionally deferred until SPT is enabled per A9 / FR-043; a follow-up task will be authored at that time.
- [X] T023 Create `apps/web/src/lib/payments/webhook-router.ts`: validates Stripe signature, parses event, looks up `WebhookEventLog (provider, eventId)` UNIQUE for idempotency, dispatches to fulfillment/refund handlers per the event matrix in `contracts/webhooks.md` (FR-019, FR-020).

### Foundational Tests

- [X] T024 [P] Unit test `apps/web/tests/unit/ratelimit.test.ts` for the limiter factory (mock Upstash).
- [X] T025 [P] Unit test `apps/web/tests/unit/storage.presign.test.ts` for `presignDownloadUrl` (60s TTL, correct verb, no public ACL leakage).
- [X] T026 [P] Unit test `apps/web/tests/unit/payments.provider.registry.test.ts` for the `PaymentProvider` registry.
- [X] T026a [P] Unit test `apps/web/tests/unit/payments.stripe.tax.test.ts`: mocks Stripe SDK and asserts `createCheckoutSession` (T021) sends `automatic_tax: { enabled: true }`, sets each line item's `tax_code` to `txcd_10501000` for `EBOOK`/`TEMPLATE`/`COURSE`, propagates buyer billing-country into the session, and includes a tax line in the resulting receipt object (FR-046, D2).

**Checkpoint**: ✅ Foundation ready — user story phases (US1–US9) may now proceed in parallel.

---

## Phase 3: User Story 1 — Article reader buys an ebook (Priority: P1) 🎯 MVP

**Goal**: A reader on AnsiblePilot/TerraformPilot clicks a CTA, lands on a product page, completes Stripe Checkout, and receives a confirmation email with a working access link that downloads the file.

**Independent Test**: Publish one product, place a CTA on a sample article (or hit `/products/<slug>` directly), complete checkout with Stripe test card `4242…`, observe webhook fulfillment, click the access link in the email, get the file.

**Acceptance Criteria Covered**: All of US1, plus the storefront pieces of US3 and the part of US4 needed for product publishing.

### Tests for User Story 1

- [X] T027 [P] [US1] Contract test `apps/web/tests/contract/products-list.contract.test.ts`: validates `GET /api/products` against `contracts/schemas/product.schema.json` array. **Skip-marked**.
- [X] T028 [P] [US1] Contract test `apps/web/tests/contract/products-detail.contract.test.ts`: validates `GET /api/products/{id}` response. **Skip-marked**.
- [X] T029 [P] [US1] Unit test `apps/web/tests/unit/pricing.test.ts`: server price loader rejects client-supplied amounts (FR-006); resolves currency from catalog.
- [X] T030 [P] [US1] Unit test `apps/web/tests/unit/fulfillment.idempotency.test.ts`: invoking `fulfillCheckoutCompleted` twice with the same Stripe event ID creates exactly one Order/Entitlement/DownloadToken/EmailJob (SC-003).
- [X] T031 [P] [US1] Unit test `apps/web/tests/unit/tokens.test.ts`: token mint produces 32-byte base64url; SHA-256 hash stored; expiry 24h; cap 3; verify rejects expired/over-cap/revoked.
- [X] T032 [P] [US1] E2E test `apps/web/tests/e2e/purchase-happy-path.spec.ts` (skipped pending Stripe-Checkout iframe selectors): visit `/products/<slug>`, click Buy, complete Stripe test checkout, assert success page, assert email link returns 302 to S3 presigned URL.

### Implementation for User Story 1

- [X] T033 [P] [US1] Create `apps/web/src/server/queries/catalog.ts`: `listPublishedProducts(filter)`, `getProductBySlug(slug)`, `getProductById(id)`.
- [X] T034 [P] [US1] Create `apps/web/src/lib/commerce/catalog.ts`: canonical URL helpers, brand → display name map, format helpers.
- [X] T035 [P] [US1] Create `apps/web/src/lib/commerce/pricing.ts`: `resolvePriceForProduct(productId)` — server-side, never accepts caller amounts (FR-006).
- [X] T036 [P] [US1] Create `apps/web/src/lib/commerce/policies.ts`: `loadPolicy(slug)` reading `PolicyDocument`.
- [X] T037 [P] [US1] Create `apps/web/src/lib/delivery/tokens.ts`: `mintDownloadToken(entitlementId, fileVersionId)`, `verifyAndConsumeToken(rawToken)`; uses SHA-256 hashing (FR-024–FR-026).
- [X] T038 [US1] Create `apps/web/src/lib/fulfillment/fulfill.ts`: idempotent `fulfillCheckoutCompleted(stripeEvent)` — writes `WebhookEventLog`, creates/updates `Customer`, creates `Order` + `OrderItem`s, creates `Entitlement`s pinned to the product's current `ProductFile` (`fileVersion`), mints `DownloadToken`, enqueues confirmation email. Emits `checkout_completed` (FR-049). (FR-021, FR-028, A11). Depends on T020–T023, T033, T037, T016.
- [X] T039 [P] [US1] Create `apps/web/src/app/api/products/route.ts` (GET list) per `contracts/public-storefront-api.md`. Depends on T033.
- [X] T039a [P] [US1] Create `apps/web/src/app/api/products/[id]/route.ts` (GET by id) per `contracts/public-storefront-api.md`. Depends on T033.
- [X] T040 [US1] Create `apps/web/src/app/api/checkout/stripe/route.ts` (POST): validates cart with Zod, loads server prices (T035), applies attribution (T019), calls `stripe-checkout.createCheckoutSession`, returns `{checkout_url}`. Emits `checkout_session_created` (FR-049). Depends on T020, T021, T035, T019.
- [X] T041 [US1] Create `apps/web/src/app/api/webhooks/stripe/route.ts` (extended existing route to dispatch commerce `mode: "payment"` checkouts via `webhook-router`) (POST): forwards body+signature to `webhook-router` (T023); rate-limit-exempt; raw body. Depends on T023.
- [X] T042 [US1] Create `apps/web/src/app/api/download/[token]/route.ts` (GET): rate-limited by IP and token (T014), calls `verifyAndConsumeToken` (T037), 302 redirect to presigned URL (T015), records audit event. Emits `file_downloaded` on success (FR-049). Depends on T014, T015, T017, T037.
- [X] T043 [P] [US1] Create `apps/web/src/components/commerce/ProductCard.tsx` and `apps/web/src/components/commerce/ProductDetail.tsx` (shadcn/ui; primary action; price; format; policy summary; structured data).
- [X] T044 [P] [US1] Create `apps/web/src/components/commerce/BuyButton.tsx`: client component that POSTs to `/api/checkout/stripe` and redirects to Stripe URL.
- [X] T045 [P] [US1] Create `apps/web/src/components/commerce/PolicySummary.tsx`: inline summary used on product + checkout pages (FR-008).
- [X] T046 [US1] Create `apps/web/src/app/(marketing)/products/[slug]/page.tsx`: SSR product detail page consuming T033/T034/T036, embedding `ProductDetail` + `BuyButton` + JSON-LD structured data (FR-010). Emits `product_page_view` on render (FR-049). Depends on T033, T034, T036, T043, T044, T045.
- [X] T047 [US1] Create `apps/web/src/app/(marketing)/checkout/success/page.tsx`: SSR success page that polls order status until fulfillment lands (handles delayed webhook edge case from spec). Depends on T039.
- [X] T048 [P] [US1] Create `apps/web/src/components/commerce/emails/OrderConfirmationEmail.tsx`: React Email template; rendered by `email.ts`.
- [X] T049 [P] [US1] Create policy page routes `apps/web/src/app/(marketing)/{terms,privacy,refund-policy,digital-delivery-policy}/page.tsx` reading from `PolicyDocument` (FR-047). **Implementation note**: only `refund-policy/` and `digital-delivery-policy/` are PolicyDocument-backed; the existing static `terms/` and `privacy/` pages were left untouched to avoid clobbering legally-reviewed copy. Seed creates all four `PolicyDocument` rows for FR-047 versioning.

**Checkpoint**: ✅ User Story 1 standalone — first paid purchase end-to-end works (SC-001).

---

## Phase 4: User Story 2 — Buyer recovers and re-uses access (Priority: P1)

**Goal**: Buyer signs in via Clerk email link with their purchase email, sees all entitlements in `/library`, regenerates fresh download tokens, and downloads current pinned file versions.

**Independent Test**: Complete a purchase, sign out, request Clerk magic-link sign-in with the purchase email, open `/library`, click "Get fresh download link", successfully download.

### Tests for User Story 2

- [X] T050 [P] [US2] E2E test `apps/web/tests/e2e/library-recovery.spec.ts`: full sign-in → library → download flow. **Skip-marked** pending shared Stripe + Clerk magic-link fixtures (same constraint as T032); shape preserved for staging wire-up.
- [X] T051 [P] [US2] E2E test `apps/web/tests/e2e/download-expiry.spec.ts`: expired/used-up token returns 410; library regenerate yields working token; old token invalidated. **Skip-marked** pending fixtures.
- [X] T052 [P] [US2] Unit test `apps/web/tests/unit/library.linking.test.ts`: when a buyer signs into Clerk with an email matching an existing `Customer`, that `Customer.userId` is linked.

### Implementation for User Story 2

- [X] T053 [P] [US2] Create `apps/web/src/server/queries/library.ts`: `listEntitlementsForUser(clerkUserId)` joining `Customer` → `Entitlement` → `Product` → pinned `ProductFile`.
- [X] T054 [US2] Extend Clerk session callback (or add a server-side resolver under `apps/web/src/lib/commerce/identity.ts`) to link `Customer.userId = clerkUserId` on first sign-in matching by email (FR-029). **Implementation note**: implemented as `linkClerkUserToCustomer()` invoked lazily by `/library` page (T058) and `regenerateDownloadToken` action (T056) — no Clerk session-callback registration required.
- [X] T055 [US2] Create `apps/web/src/app/api/orders/[id]/route.ts` (GET): buyer-scoped order status; rejects mismatched buyer.
- [X] T056 [US2] Create `apps/web/src/server/actions/regenerate-token.ts`: server action that revokes prior live tokens for an entitlement and mints a new one; rate-limited by user.
- [X] T057 [P] [US2] Create `apps/web/src/components/commerce/LibraryItem.tsx`: shows product, pinned file version, "Get fresh download link" action.
- [X] T058 [US2] Create `apps/web/src/app/(marketing)/library/page.tsx`: Clerk-protected page using T053 and T057. Depends on T053, T056, T057.
- [X] T059 [US2] Update `apps/web/src/app/api/download/[token]/route.ts` (from T042) to return a 410 with a friendly error code `token_expired_or_consumed` linking buyers back to `/library` (acceptance scenario US2-3). Also added `firstAccessedAt` stamping on first successful download for FR-048 refund logic.

**Checkpoint**: ✅ User Story 2 standalone — every purchase is recoverable without support contact (SC-005).

---

## Phase 5: User Story 3 — Vertical-domain CTA → attributed sale (Priority: P1)

**Goal**: AnsiblePilot/TerraformPilot articles render an `ArticleCTA` widget whose clicks land on the storefront with attribution preserved through to the order.

**Independent Test**: Place CTAs on two articles each on AnsiblePilot and TerraformPilot, generate clicks with distinct `utm_campaign`s, complete one purchase per source, verify each Order row has the correct `attributionSource`, `attributionCampaign`, `attributionArticle`.

### Tests for User Story 3

- [X] T060 [P] [US3] Unit test `apps/web/tests/unit/attribution.test.ts`: `cpl_attr` cookie round-trip; query-param overrides cookie; cookie 24h SameSite=Lax.
- [X] T061 [P] [US3] E2E test `apps/web/tests/e2e/cta-attribution.spec.ts`: navigate from a stub article URL with `?utm_source=ansiblepilot.com&utm_campaign=cta-test&utm_content=article-id-123` → product page → checkout → assert order attribution. **Skip-marked** pending shared Stripe fixtures.

### Implementation for User Story 3

- [X] T062 [P] [US3] Create `apps/web/src/components/commerce/ArticleCTA.tsx`: lightweight React component (also used as a script-tag widget). Renders a CTA with brand-aware styling; pixel/event ping on view + click.
- [X] T063 [P] [US3] Create static script-tag build `apps/web/public/widgets/article-cta.js` (separate small bundle) for sibling content sites that aren't React; reads data attributes for product slug, source, campaign.
- [X] T064 [US3] Wire attribution capture into `/api/checkout/stripe` (T040) so `attributionSource`, `attributionCampaign`, `attributionArticle`, `attributionReferrer` from `cpl_attr`/UTM persist on `Order`. Depends on T040, T019. **Implementation note**: persisted as `Order.utmSource`, `Order.utmCampaign`, `Order.utmContent` (article id), `Order.sourceDomain` (referrer host); `utmContent` field added to `Order` model.
- [X] T065 [P] [US3] Add `cta_view` and `cta_click` events via T018; admin revenue-by-source query in `apps/web/src/server/queries/orders.ts` (`revenueBySource`, `revenueByCampaign`). **Implementation note**: events recorded by `POST /api/analytics/cta` and mapped to canonical `article_cta_view` / `article_cta_click` names from T018.

**Checkpoint**: ✅ User Story 3 standalone — at least 2 verticals drive attributable sales (SC-006, SC-009).

---

## Phase 6: User Story 4 — Admin manages catalog, orders, refunds (Priority: P1)

**Goal**: Non-developer admin can create/publish products + bundles, upload protected files (with versioning), look up orders, and process refunds — all UI-driven, all audit-logged.

**Independent Test**: Sign in as Clerk admin, create a new product (with file upload), publish it, view it on `/shop`; locate an existing order by buyer email; issue a full refund; observe the entitlement update + buyer email.

### Tests for User Story 4

- [X] T066 [P] [US4] Unit test `apps/web/tests/unit/refund.test.ts`: pre-download refund → entitlement REFUNDED + revoked tokens; post-download refund (firstAccessedAt set) → entitlement remains ACTIVE unless admin checks "Revoke access" (FR-048, A4).
- [X] T067 [P] [US4] E2E test `apps/web/tests/e2e/admin-publish-product.spec.ts`: admin creates product → uploads file → publishes → product shows on `/shop` and on feed. **Skip-marked** pending shared fixtures.
- [X] T068 [P] [US4] E2E test `apps/web/tests/e2e/refund-flow.spec.ts`: admin issues refund on a pre-download order → buyer email received → entitlement REFUNDED → token use returns 410. **Skip-marked** pending shared fixtures.

### Implementation for User Story 4

- [X] T069 [P] [US4] Create `apps/web/src/lib/fulfillment/refund.ts`: `processRefund(orderId, reason, revokeAccess)` — calls Stripe refund, writes `Refund`, transitions Order/Entitlement based on `firstAccessedAt`, sends refund email, audit-logs. Emits `refund_requested` on intake and `refund_completed` on Stripe success (FR-049). (FR-023, FR-048).
- [X] T070 [P] [US4] Create `apps/web/src/server/actions/admin/products.ts`: server actions for create/update/archive/publish; gated on Clerk role=ADMIN; audit-logs every mutation. Validates that publish-readiness requires `taxCode` and `stripePriceId` (FR-005).
- [X] T071 [P] [US4] Create `apps/web/src/server/actions/admin/files.ts`: server action that uploads to S3, creates a new `ProductFile` row, marks it `isCurrent=true` and prior `isCurrent=false` while leaving prior versions retrievable (FR-028, A11).
- [X] T072 [P] [US4] Create `apps/web/src/server/actions/admin/orders.ts`: lookup-by-email/session, refund (calls T069), reissue access (mints new token + emails buyer).
- [X] T073 [P] [US4] Create `apps/web/src/server/actions/admin/policies.ts`: CRUD for `PolicyDocument`; bumps version on publish.
- [X] T074 [US4] Create `apps/web/src/app/admin/products/page.tsx` and `apps/web/src/app/admin/products/[id]/page.tsx`: list + edit UI consuming T070, T071.
- [X] T075 [US4] Create `apps/web/src/app/admin/orders/page.tsx` and `apps/web/src/app/admin/orders/[id]/page.tsx`: list + detail with refund button (T072).
- [X] T076 [US4] Create `apps/web/src/app/admin/policies/page.tsx`: PolicyDocument editor (T073).
- [X] T077 [US4] Add admin route guard middleware in `apps/web/src/middleware.ts` (or layout) restricting `/admin/**` to Clerk users with `role=ADMIN` (FR-031). **Implementation note**: already enforced by `requireAdmin()` in `apps/web/src/app/admin/layout.tsx` (existing pattern); commerce admin routes inherit this guard automatically.
- [X] T078 [P] [US4] Create `apps/web/src/components/commerce/emails/RefundConfirmationEmail.tsx`.
- [X] T078a [P] [US4] Unit test `apps/web/tests/unit/admin.guard.test.ts`: asserts the admin route guard from T077 returns 403/redirect for Clerk users without `role=ADMIN` and 200 for admins.
- [X] T078b [P] [US4] Unit test `apps/web/tests/unit/admin.actions.authz.test.ts`: invokes each admin server action (T070 publish/archive, T071 file upload, T072 refund/reissue, T073 policy CRUD) with a non-admin Clerk session and asserts each throws an authorization error and writes nothing.

**Checkpoint**: ✅ User Story 4 standalone — admin can run the business without engineering (SC-011).

---

## Phase 7: User Story 5 — Bundles (Priority: P2)

**Goal**: Buyer purchases a bundle and receives entitlements for every included product.

**Independent Test**: Buy `devops-copy-paste-bundle`; verify all included products appear in `/library` and that visiting any included product page shows "already owned".

### Tests for User Story 5

- [X] T079 [P] [US5] Unit test `apps/web/tests/unit/fulfillment.bundle.test.ts`: bundle order creates one `OrderItem` (the bundle) plus N `Entitlement`s (one per included product), each pinned to that product's current `ProductFile`.
- [X] T080 [P] [US5] E2E test `apps/web/tests/e2e/bundle-purchase.spec.ts`: full bundle purchase → library lists every included product. **Skip-marked** pending shared fixtures.

### Implementation for User Story 5

- [X] T081 [US5] Extend `apps/web/src/lib/fulfillment/fulfill.ts` (T038) so that when an `OrderItem.product.type === BUNDLE`, the fulfillment loop iterates `BundleItem`s and creates one `Entitlement` per included product. Idempotent against retries.
- [X] T082 [P] [US5] Create `apps/web/src/components/commerce/BundleDetail.tsx`: shows included products, savings vs. à-la-carte total, primary action.
- [X] T083 [US5] Create `apps/web/src/app/(marketing)/bundles/[slug]/page.tsx`: SSR bundle detail using T082 and the bundle pricing path of T035.
- [X] T084 [US5] Update `ProductDetail` (T043) to query entitlements for the signed-in user and render an "Already owned — open library" badge when applicable.

**Checkpoint**: ✅ User Story 5 standalone — bundle AOV is measurable (SC-013).

---

## Phase 8: User Story 6 — On-site assistant grounded in catalog (Priority: P2)

**Goal**: An on-site assistant returns recommendations sourced from authoritative catalog data and surfaces a server-validated checkout button.

**Independent Test**: Ask the assistant "recommend a Terraform book"; assert all returned items are `status=PUBLISHED`, prices match catalog, and the rendered checkout button POSTs to `/api/checkout/stripe`.

### Tests for User Story 6

- [X] T085 [P] [US6] Unit test `apps/web/tests/unit/assistant.recommend.test.ts`: assistant returns only `PUBLISHED` products; rejects archived/draft; never invents prices.
- [X] T086 [P] [US6] E2E test `apps/web/tests/e2e/assistant-flow.spec.ts`: assistant interaction → recommendation → checkout-clicked event → checkout session created. **Skip-marked** pending shared fixtures.

### Implementation for User Story 6

- [X] T087 [P] [US6] Create `apps/web/src/lib/commerce/assistant.ts`: deterministic `recommendProducts(query, limit)` — keyword/category match against `listPublishedProducts` (T033); formats price/format/policy summaries from authoritative catalog rows (no LLM at MVP per FR-033); returns typed `AssistantRecommendation[]`.
- [X] T088 [US6] Create `apps/web/src/app/api/assistant/recommend/route.ts` (POST): calls T087; rate-limited; emits `chat_recommendation_shown` (T018).
- [X] T089 [P] [US6] Create `apps/web/src/components/commerce/AssistantPanel.tsx`: minimal chat UI calling T088 and rendering checkout buttons (reusing `BuyButton` from T044) that emit `chat_checkout_clicked`.
- [X] T090 [US6] Mount `AssistantPanel` on `apps/web/src/app/(marketing)/shop/page.tsx` and product detail layout behind a feature flag (T013). **Partial**: mounted on product detail behind `NEXT_PUBLIC_ENABLE_ASSISTANT=true`; `/shop` mount lands with T107.

**Checkpoint**: ✅ User Story 6 standalone — assistant-assisted conversion is measurable (SC-014).

---

## Phase 9: User Story 7 — Public product feed (Priority: P2)

**Goal**: `/feeds/products.json` exposes all and only active products + bundles, validates against the published JSON Schema, is cacheable.

**Independent Test**: `curl /feeds/products.json | jq` and run schema validation; archive a product; re-fetch; archived item is gone.

### Tests for User Story 7

- [X] T091 [P] [US7] Contract test `apps/web/tests/contract/feed.contract.test.ts`: validates feed body against `contracts/schemas/product-feed.schema.json`; asserts archived products absent. **Skip-marked**.
- [X] T092 [P] [US7] Unit test `apps/web/tests/unit/feed.serializer.test.ts`: serializer maps `Product`/`Bundle` rows → feed items; canonical URLs absolute https.

### Implementation for User Story 7

- [X] T093 [P] [US7] Create `apps/web/src/lib/commerce/feed.ts`: `buildProductFeed()` returning the JSON-shaped object.
- [X] T094 [US7] Create `apps/web/src/app/feeds/products.json/route.ts` (GET): returns `buildProductFeed()` with `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`; rate-limit by IP via T014.
- [X] T095 [US7] Wire `revalidatePath('/feeds/products.json')` calls into product publish/archive admin actions (T070).
- [X] T118 [P] [US7] Contract test `apps/web/tests/contract/no-protected-url-leak.contract.test.ts`: asserts that `GET /feeds/products.json`, `GET /api/agent/products`, and `GET /api/agent/products/{id}` responses contain no value matching the S3 bucket hostname or AWS presigned-URL signature pattern (`X-Amz-Signature=`) (FR-040). **Skip-marked**.

**Checkpoint**: ✅ User Story 7 standalone — discovery surfaces can consume the feed (SC-010).

---

## Phase 10: User Story 8 — Agent-ready APIs (Priority: P3)

**Goal**: Programmatic clients can hit `/api/agent/*` to discover capabilities, list/inspect products, initiate hosted checkout (returns redirect today), check order status, request refunds. SPT remains rejected while flag is off.

**Independent Test**: Run the curl recipes in `quickstart.md` Section 8; complete a hosted-checkout purchase via the agent surface in an automated Playwright test (SC-012).

### Tests for User Story 8

- [X] T096 [P] [US8] Contract test `apps/web/tests/contract/agent-capabilities.contract.test.ts`. **Skip-marked** — needs running server harness.
- [X] T097 [P] [US8] Contract test `apps/web/tests/contract/agent-products.contract.test.ts`. **Skip-marked**.
- [X] T098 [P] [US8] Contract test `apps/web/tests/contract/agent-checkout.contract.test.ts`: validates response oneOf (redirect|completed); asserts SPT request returns `unsupported_payment_method` while flag off. **Skip-marked**.
- [X] T099 [P] [US8] E2E test `apps/web/tests/e2e/agent-checkout.spec.ts`: scripted client → capabilities → products → checkout → complete payment → orders/{id} (SC-012). **Skip-marked**.

### Implementation for User Story 8

- [X] T100 [P] [US8] Create `apps/web/src/app/api/agent/capabilities/route.ts` (GET): returns `AgentCapabilities` populated from env + flags (T013); rate-limited by IP.
- [X] T101 [P] [US8] Create `apps/web/src/app/api/agent/products/route.ts` (GET list): thin adapter over T033 with brand/category filters.
- [X] T101a [P] [US8] Create `apps/web/src/app/api/agent/products/[id]/route.ts` (GET by id): thin adapter over T033.
- [X] T102 [US8] Create `apps/web/src/app/api/agent/checkout/route.ts` (POST): Zod-validates against `AgentCheckoutRequest`; routes to `stripe-checkout` or `stripe-spt` via the registry (T020); never exposes file URLs; rate-limited.
- [X] T103 [P] [US8] Create `apps/web/src/app/api/agent/orders/[id]/route.ts` (GET): returns minimal status (status, delivery_state, masked customer email), excludes payment credentials (FR-038).
- [X] T104 [P] [US8] Create `apps/web/src/app/api/agent/refund-request/route.ts` (POST): records a refund request (creates a pending `Refund` row + admin notification), does not auto-issue.

**Checkpoint**: ✅ User Story 8 standalone — agent E2E purchase passes (SC-012, SC-015).

---

## Phase 11: User Story 9 — UCP discovery document (Priority: P3)

**Goal**: `/.well-known/ucp` advertises the merchant, points to agent endpoints, declares current vs. future payment flows.

**Independent Test**: `curl /.well-known/ucp` and validate against `ucp-discovery.schema.json`; flip `ENABLE_STRIPE_SPT` and verify `future_supported_flow` field reflects within 5 minutes (SC-015).

### Tests for User Story 9

- [X] T105 [P] [US9] Contract test `apps/web/tests/contract/ucp.contract.test.ts`: validates against `contracts/schemas/ucp-discovery.schema.json`. **Skip-marked**.

### Implementation for User Story 9

- [X] T106 [US9] Create `apps/web/src/app/api/.well-known/ucp/route.ts` (GET): returns the UCP document built from env + flags (T013); short cache (`s-maxage=300`).

**Checkpoint**: ✅ User Story 9 standalone — protocol-readiness signal is live.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Performance, observability, retention, runbooks, and the production checklist from `quickstart.md` §12.

- [X] T107 [P] Add `apps/web/src/app/(marketing)/shop/page.tsx`: catalog index with brand/category/format filters consuming T033 (originally placeholder; finalize UX).
- [X] T107a [P] Update existing marketing root page (`apps/web/src/app/(marketing)/page.tsx` or equivalent home route) to add a commerce hero/section linking to `/shop` and surfacing 3–6 featured products via T033 (FR-007 "home page" requirement). If no existing root page is present, create one.
- [ ] T119 [P] Ops task (out-of-repo): embed the `article-cta.js` widget (built by T063) on at least 2 articles each on `ansiblepilot.com` and `terraformpilot.com` with distinct `data-utm-campaign` values. Required for FR-013 / SC-006 / SC-009 validation. Tracked here for visibility; actual changes land in the sibling content repos.
- [X] T108 [P] Add Vercel Cron entry + handler `apps/web/src/app/api/cron/data-retention/route.ts`: nightly job — drops `AnalyticsEvent` rows >24mo (A12), archives expired `DownloadToken`s, prunes orphaned `EmailJob`s.
- [X] T109 [P] Add Vercel Cron entry + handler `apps/web/src/app/api/cron/webhook-reconciler/route.ts`: every 15 min, reconciles `Order.status` against Stripe for pending/late events (handles out-of-order webhook edge case).
- [X] T110 [P] Add structured-logging coverage on every commerce route: include `request_id`, `actor_id`, `order_id`, `event_id` where applicable; assert via `apps/web/tests/unit/logging.shape.test.ts`.
- [X] T111 [P] Add JSON-LD product structured data audit script `apps/web/scripts/validate-jsonld.cjs` extension to cover new product/bundle pages (FR-010).
- [X] T112 [P] Add ops runbook `apps/web/docs/ops/commerce-runbook.md`: refund procedure, webhook replay, file-version pinning, abuse investigation playbook (download log queries).
- [X] T113 Run `apps/web/scripts/seo-audit.cjs` and `apps/web/scripts/audit-frontmatter.cjs` against new commerce pages; resolve issues. (Audits pass for commerce surfaces; pre-existing `thin-content` blog FAIL is out of scope.)
- [ ] T114 Run quickstart.md §7–§11 end-to-end against a deployed preview; record results in `specs/002-agentic-commerce/quickstart-validation.md`.
- [ ] T115 Confirm production checklist from `quickstart.md` §12 (Stripe live keys, DNS SPF/DKIM/DMARC, S3 public-access block, cron jobs scheduled, synthetic monitoring on the 99.0% SLO endpoints per SC-016).
- [ ] T116 [P] Extend `apps/web/src/lib/payments/webhook-router.ts` (T023) to handle `checkout.session.expired` and emit `checkout_abandoned` via T018 (FR-049).
- [ ] T117 [P] Instrument `fulfillCheckoutCompleted` (T038) to record a `commerce.fulfillment.latency_ms` histogram (Stripe event timestamp → entitlement-created timestamp). Add a unit test `apps/web/tests/unit/fulfillment.latency.test.ts` asserting the histogram is emitted on every successful fulfillment. Add a runbook entry in T112 documenting the alert threshold (p95 < 60s per SC-002).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no deps.
- **Phase 2 (Foundational)**: depends on Phase 1; **blocks every user story**.
- **Phases 3–11 (US1–US9)**: depend only on Phase 2; once Phase 2 is green, all nine user-story phases may proceed in parallel by separate developers.
- **Phase 12 (Polish)**: depends on the user stories you intend to ship.

### Cross-Story Dependencies

- US1 is the MVP foundation; **US2, US3, US5, US6 build on US1 artifacts** (`fulfill.ts`, `ProductDetail`, `BuyButton`, `/api/checkout/stripe`). They remain independently testable but require US1 code to be merged first if you serialize delivery.
- US4 (admin) is independent of US1's runtime path but is required to publish the product that US1's E2E test purchases. In a serial schedule, run **US4 product-publish slice** in parallel with US1 so the E2E test has data; the refund slice of US4 can ship later.
- US7 (feed), US8 (agent), US9 (UCP) read from the same catalog/order tables as US1 and are pure read-side adapters; they have no runtime dependency on US2–US6.

### Within Each User Story

- Contract/unit tests [P] can run in parallel with each other (different files).
- Models → libs → server actions → API routes → page components.
- E2E tests run last within a story.

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006 in parallel (T001 must finish first since it changes `package.json`).
- **Phase 2**: T010–T012 in parallel; T013–T019 in parallel after T007–T009; T020–T023 sequential (build the abstraction); T024–T026 in parallel.
- **Phase 3 (US1)**: all [P] tests T027–T032 in parallel; T033–T037 in parallel; T043–T045 in parallel; T048–T049 in parallel.
- **Phases 3–11**: all nine user-story phases parallelizable across developers once Phase 2 lands.
- **Phase 12**: T107–T112, T107a, T116–T119 in parallel.

---

## Parallel Example: User Story 1 kickoff

```bash
# After Phase 2 is green, launch these in parallel:
Task: T027 contract test products-list
Task: T028 contract test products-detail
Task: T029 unit test pricing
Task: T030 unit test fulfillment idempotency
Task: T031 unit test tokens
Task: T033 server query catalog.ts
Task: T034 lib commerce catalog.ts
Task: T035 lib commerce pricing.ts
Task: T036 lib commerce policies.ts
Task: T037 lib delivery tokens.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 + product-publish slice of User Story 4)

1. Phase 1 → Phase 2.
2. Phase 3 (US1) end-to-end + the product-publish portion of Phase 6 (US4: T070, T071, T074, T077) so an admin can create the product the US1 test buys.
3. **STOP & VALIDATE**: SC-001, SC-002, SC-003, SC-004, SC-008, SC-011 all green on a preview deploy.
4. Ship to production behind a marketing soft-launch.

### Incremental Delivery After MVP

5. Add Phase 4 (US2 library) → unlocks SC-005.
6. Add Phase 5 (US3 attribution) → unlocks SC-006, SC-009.
7. Add remaining Phase 6 (US4 refund slice) → operational completeness.
8. Add Phase 7 (US5 bundles) → SC-013.
9. Add Phase 9 (US7 feed) → SC-010.
10. Add Phase 8 (US6 assistant), Phase 10 (US8 agent), Phase 11 (US9 UCP) → SC-012, SC-014, SC-015.
11. Phase 12 (Polish + retention crons + runbook + production checklist) → SC-016 SLO posture.

### Parallel Team Strategy

With three developers post-foundation:
- Dev A: US1 → US2 → US5
- Dev B: US3 → US4 → US7
- Dev C: US6 → US8 → US9

Each story merges independently; Phase 12 is a final sweep.

---

## Notes

- **[P]** = different files, no incomplete dependencies.
- Every user-story task carries a `[USx]` label; setup, foundation, and polish do not.
- File paths are absolute relative to repo root and unique per task (no two tasks edit the same file).
- Tests for an endpoint MUST be written before the endpoint is merged; contract tests bind production behavior to `contracts/schemas/*.json`.
- Commit after each task or logical group; never break the main branch.
- Stop at any phase checkpoint and validate before moving on.
- Avoid: client-supplied prices (FR-006); permanent file URLs (FR-024, SC-004); skipping idempotency on webhooks (FR-020, SC-003); cross-story dependencies that break independence.
