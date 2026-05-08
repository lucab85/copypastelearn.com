# Phase 0 Research: Agentic Commerce Platform

**Feature**: 002-agentic-commerce
**Date**: 2026-05-08
**Status**: Complete — no `NEEDS CLARIFICATION` items remain in the Technical Context.

This document records the technical research and vendor/library decisions made during planning. Each item follows: **Decision → Rationale → Alternatives considered**.

---

## 1. Identity for buyers (FR-029)

**Decision**: Reuse Clerk (already in `apps/web` for the existing learning platform) and enable email-link / one-time-code sign-in for the storefront. Buyer identity is keyed by `clerkUserId`; the `Customer` record holds the `stripeCustomerId` and country.

**Rationale**: Constitution Principle III ("Ship Fast with Ready Solutions") and Principle V ("Clean Integration Boundaries — Clerk is the source of truth for identity"). Buyers and learners are the same population; running a second identity provider would fork the user table and break support workflows. Clerk supports passwordless email-link and OTP out of the box, satisfying FR-029.

**Alternatives considered**:
- **NextAuth/Auth.js with email magic links**: free but adds a parallel identity stack; rejected on Principle III + V.
- **Stripe Customer Portal as the only login**: covers receipts but cannot gate the buyer library or admin; rejected.
- **No login, email-only links**: tokens already do this for files; but a durable library (FR-030) and update redelivery (FR-028 → A11) require account binding.

---

## 2. Payment provider — hosted checkout, tax, and future tokenized payment (A5, FR-014, FR-046, FR-042)

**Decision**: Stripe — Stripe Checkout (hosted) for one-time digital purchases at launch; Stripe Tax enabled for the Dutch operating entity to handle EU VAT/OSS; Stripe Shared Payment Tokens (SPT) implemented as a parallel `PaymentProvider` strategy gated behind `ENABLE_STRIPE_SPT=false` (FR-043). Use a Stripe Restricted Key on the server for least-privilege.

**Rationale**: Fixed business decision (Assumption A5). Stripe Checkout is PCI-out-of-scope (FR-016), supports cards + iDEAL/Bancontact/SEPA + Apple/Google Pay for EU buyers (FR-015), provides automatic tax for digital goods, and emits the events the fulfillment matrix needs (`checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `checkout.session.expired`). Stripe SPT remains a U.S.-Stripe-account capability today, which is why it is feature-flag-only at launch (A1, A9).

**MVP payment-method set (per FR-015)**: `card`, `ideal`, `bancontact`, `sepa_debit`, `apple_pay`, `google_pay`. These are configured at the Stripe Dashboard level on the Dutch account (Settings → Payments → Payment methods) rather than per-session in code, so adding methods post-launch (e.g., `klarna`, `p24`) is a configuration change with no code deploy. The `createCheckoutSession` call therefore omits `payment_method_types` and lets Stripe present whatever the account has enabled, filtered by buyer locale and currency.

**Alternatives considered**:
- **Paddle as Merchant of Record**: would shift the seller-of-record away from Open Empower B.V. and conflict with Assumption A1.
- **LemonSqueezy / Gumroad**: same MoR conflict; also less control over the agent-API and feed shape.
- **Mollie + custom tax**: viable in EU but lacks the agentic-payment direction (SPT) the spec wants to be ready for.

---

## 3. Idempotent webhook fulfillment (FR-019, FR-020, SC-003)

**Decision**: A `WebhookEventLog` table with `(provider, event_id)` UNIQUE constraint, written inside the same Postgres transaction as the order/entitlement creation. Stripe `event.id` is the natural idempotency key. The handler verifies the signature with `stripe.webhooks.constructEvent`, looks up `WebhookEventLog`, and skips on duplicate. Fulfillment uses `prisma.$transaction([...])` so order + entitlements + tokens + outbound-email queue insert atomically.

**Rationale**: Stripe explicitly recommends event-id deduplication; combining it with a SQL UNIQUE makes idempotency a database invariant, not application logic. Using a single transaction prevents the partial-fulfillment failure mode (e.g., order created but no entitlements) that breaks SC-002/SC-003.

**Alternatives considered**:
- **Redis SETNX on event id**: faster but loses durability if Redis is flushed; rejected for a financial path.
- **Inngest / queue-based deduper**: would work but adds an unnecessary service; current scale doesn't justify it.

---

## 4. Protected file storage (FR-024, FR-040, SC-004)

**Decision**: AWS S3 (or an S3-compatible bucket — Cloudflare R2 is the secondary choice on cost grounds) with **all objects private** (no public ACLs, bucket policy `BlockPublicAccess`). Downloads go through `/api/download/[token]` which validates the token, increments the download count, then mints a 60-second presigned GET URL and 302-redirects to it. Files are uploaded via admin server actions using a server-only S3 client.

**Rationale**: FR-024 explicitly forbids permanent or guessable public URLs. A 60-second presigned URL paired with a 24-hour application-level token (FR-025) gives two independent expiry layers. S3 + presigned URLs is the lowest-complexity production-grade pattern and is supported on Vercel.

**Alternatives considered**:
- **Vercel Blob**: simpler but presigned-URL semantics are less mature than S3's; also costlier at scale.
- **Cloudflare R2**: zero egress fees — strong secondary choice; final pick deferred to ops, both work with the same `@aws-sdk/s3-request-presigner` code path.
- **Serving bytes through the Next.js route handler**: simpler but burns Vercel function execution time on each download and doesn't scale; rejected.

---

## 5. Download tokens — generation, hashing, expiry (FR-025, Q3 = 24h / 3 downloads)

**Decision**: Tokens are 32 random bytes encoded base64url (43 chars). Stored hashed (SHA-256) at rest in `DownloadToken.tokenHash`. Validity: 24 hours, max 3 successful downloads. The buyer's library exposes a "Get fresh download link" action that mints a new token bound to the same entitlement. Token revocation = setting `revokedAt`; expired/revoked/exceeded tokens return a friendly "request a fresh link" page (not a 404).

**Rationale**: Q3 outcome (24h, 3 downloads, regenerable from library) — see [spec.md#Clarifications](spec.md). Hashing at rest means a database leak doesn't grant downloads. Base64url avoids URL-encoding edge cases. SHA-256 is sufficient because the token is high-entropy random; we are not protecting against brute force on the hash.

**Alternatives considered**:
- **JWT-style signed tokens**: stateless and no DB lookup, but cannot support revocation or per-token download counts cleanly; rejected.
- **bcrypt/argon2 hashing**: overkill for 256-bit random tokens; SHA-256 is the right tool.

---

## 6. Transactional email (FR-021, A8)

**Decision**: Resend (HTTPS API, React Email templates) sending from `noreply@copypastelearn.com` with SPF/DKIM/DMARC configured on the storefront domain. Emails sent: purchase confirmation with secure access link, refund confirmation, sign-in link (via Clerk; not Resend), download-link regenerated notification. A nightly retry job re-sends any email whose first attempt failed (queued in `EmailJob` table).

**Rationale**: Resend has first-class React Email support, simple DKIM setup, EU sending region, and a generous free tier suitable for MVP volume. Aligns with Principle III. The storefront domain is the right sender per A8.

**Alternatives considered**:
- **Postmark**: excellent transactional reputation; equally good fit. Either works — Resend chosen for React Email integration.
- **AWS SES**: cheap but more setup; deferred unless volume justifies it.
- **SendGrid**: viable but heavier API.

---

## 7. Rate limiting (FR-041, FR-053)

**Decision**: `@upstash/ratelimit` backed by Upstash Redis (HTTP-based, edge-friendly). Default policies:
- `/api/agent/*`: 60 req/min per IP, 600 req/min per API key (when keys land in a later phase).
- `/feeds/products.json`: 30 req/min per IP — feed is also CDN-cached for 5 minutes via `Cache-Control: public, s-maxage=300`.
- `/api/download/[token]`: 30 req/min per IP, 100 req/min per token.
- `/api/webhooks/stripe`: not rate-limited (Stripe IP allowlist enforced + signature verification — rate-limiting Stripe redeliveries is harmful).

**Rationale**: Upstash REST API works on Vercel Edge runtime, no connection-pooling pain. Token-bucket per-IP+per-resource gives both DoS protection and predictable agent-developer experience. Webhook endpoint is intentionally exempt because Stripe must always be able to redeliver; signature verification + idempotency log is the right gate there.

**Alternatives considered**:
- **Vercel Edge Middleware bucket**: lacks shared state across edges; rejected.
- **Custom Postgres-backed limiter**: works but adds DB load on a hot path.

---

## 8. Tax: VAT / OSS classification (FR-046, D2)

**Decision**: Enable Stripe Tax on the Dutch Stripe account, classify every product with the `txcd_10501000` (Digital ebook) or `txcd_10000000` (General SaaS / digital service) tax code as appropriate, set `tax_behavior: 'exclusive'` on prices (price displayed is net; Stripe adds VAT). Capture buyer country at Checkout (Stripe collects this automatically when Tax is on). Bundles are taxed using the bundled-product code (highest applicable rate if mixed; defer mixed-rate bundles to admin review).

**Rationale**: Stripe Tax handles EU VAT registration, OSS filing, and reverse-charge for B2B with VAT IDs out of the box. Per D2 the accountant must review final tax codes before live mode — the schema stores `taxCode` per product so changes are data-only.

**Alternatives considered**:
- **Manual VAT calc + Avalara**: overengineered for ≤10 products at launch.
- **Tax-inclusive prices**: simpler buyer UX but harder to compare with B2B invoicing expectations; can be revisited.

---

## 9. Product feed format (FR-036)

**Decision**: A custom JSON feed at `/feeds/products.json` whose schema (committed at `contracts/schemas/product-feed.schema.json`) is a **superset of Schema.org `Product`** field semantics with stable IDs, canonical URLs, brand, currency-bearing `offers`, availability, and seller-of-record. Cached at the edge for 5 minutes; regenerated on every product publish/archive via on-demand revalidation (`revalidatePath('/feeds/products.json')`).

**Rationale**: Spec says "structured product feed" without prescribing a vendor format. JSON-with-Schema.org-semantics is the pragmatic intersection: machine-readable, easy to map later to Google Merchant Center XML/UCP if/when needed, and validates statically. A separate Google-Merchant-Center XML feed can be added under `/feeds/google-merchant.xml` later — it's a different serializer over the same `feed.ts` module.

**Alternatives considered**:
- **Google Merchant Center XML at launch**: more setup, brand-specific, and Spec doesn't require it.
- **Schema.org JSON-LD only embedded in product pages**: still required (FR-010) but not a substitute for an aggregated feed.

---

## 10. UCP discovery shape (FR-039)

**Decision**: Publish `/.well-known/ucp` returning a JSON document modeled on the PRD draft (merchant + capabilities + fulfillment + payments). Schema is committed at `contracts/schemas/ucp-discovery.schema.json`. The document explicitly does NOT claim third-party production approval and `payments.future_supported_flow` reflects the SPT feature-flag state (A9). Generated at request time from a single config object so it stays in sync with capabilities.

**Rationale**: UCP is still a moving target as of 2026-05-08; publishing a placeholder under a well-known path costs near-nothing and signals readiness. Generating from the same config used by `/api/agent/capabilities` prevents drift.

**Alternatives considered**:
- **Static JSON file in `public/`**: cheaper but drifts from capabilities; rejected.
- **Wait for finalized UCP spec**: forfeits SC-015 and the discoverability story.

---

## 11. Agent API authentication (FR-038)

**Decision**: At MVP, the agent API endpoints are **public read** for `capabilities`, `products`, and `products/{id}` (rate-limited per §7) and **anonymous-write** for `checkout` and `refund-request` — anonymous because the buyer's Stripe Checkout step authenticates the actual purchase. No agent API key is required at launch. A bearer-token regime can be layered in later without breaking shape (header-only, passes through middleware).

**Rationale**: The spec calls for the agent surface to be ready, not gated. Hosted Stripe Checkout already gates the money. Adding API keys before there's a real agent client risks designing keys we don't yet need. Rate limiting + zod validation + server-authoritative pricing handle the abuse risk.

**Alternatives considered**:
- **Issue API keys at launch**: premature; no consumer to issue to.
- **OAuth client-credentials**: same; deferred to the eventual ACP/UCP onboarding phase.

---

## 12. Source attribution & UTM (FR-012, FR-018, SC-009)

**Decision**: The `ArticleCTA` component appends `?utm_source=<domain>&utm_medium=article_cta&utm_campaign=<slug>&src=<domain>` to product URLs. The product page reads these from `searchParams`, drops them into a first-party `cpl_attr` cookie (24h, `SameSite=Lax`), and the checkout endpoint hydrates them onto the Stripe Checkout Session `metadata` and onto the resulting `Order`. Fallback: `Referer` header is recorded too, but `cpl_attr` cookie wins.

**Rationale**: First-party cookie survives the Stripe Checkout redirect round-trip (the redirect is same-site back to the storefront). UTM in Stripe metadata makes attribution recoverable from Stripe Dashboard alone, which helps support and audits.

**Alternatives considered**:
- **localStorage-only attribution**: fails for users who block JS storage; rejected.
- **Server-side attribution via Referer only**: unreliable across browsers and not preserved across Stripe redirect.

---

## 13. Webhook event matrix (FR-019..FR-023)

**Decision**: The handler subscribes to and processes:

| Stripe Event | Action |
|---|---|
| `checkout.session.completed` | Verify `payment_status === 'paid'`, run idempotent `fulfill()` (create Customer/Order/Entitlements/DownloadTokens, queue confirmation email). |
| `payment_intent.succeeded` | No-op for Checkout flow; logged. Acts as the canonical event for the future `payment_intent`/SPT flow (FR-042). |
| `payment_intent.payment_failed` | Mark Order `failed`; no entitlements granted. |
| `checkout.session.expired` | Mark draft Order `expired`; cleanup. |
| `charge.refunded` | Look up Order via `payment_intent_id`; create `Refund` record; revoke entitlements per refund policy (A4: pre-download → revoke; post-download → revoke unless admin overrides — admin override is a separate field). |

All other events: log and ignore.

**Rationale**: Minimal viable surface that satisfies FR-019..FR-023 and the edge cases (out-of-order delivery, duplicate delivery). `payment_intent.succeeded` is wired now even though it's a no-op so the future SPT path doesn't require schema changes.

**Alternatives considered**:
- **Subscribe to all events**: noisy, increases attack surface, no benefit.

---

## 14. Admin role + audit (FR-031, FR-032)

**Decision**: Reuse the existing Clerk `Role` enum (`LEARNER | ADMIN`) — admin commerce routes require `role === 'ADMIN'`. Audit log lives in a new `AdminAuditEvent` table (`actorId, action, targetType, targetId, payload, createdAt`); every server action under `src/server/actions/admin/` writes a single audit row inside the same transaction as the change.

**Rationale**: Single role model across the app (Principle V); audit-in-transaction guarantees no silent admin actions.

**Alternatives considered**:
- **Separate `COMMERCE_ADMIN` role**: not needed at this scale; can be added later without migration of existing data.

---

## 15. Free updates (FR-028, A11) — version pinning

**Decision** *(per Q1 = A — version pinned at purchase)*: `Entitlement.fileVersion` records the `ProductFile.version` current at fulfillment time. The library always offers that pinned version. New versions are visible to new buyers only. Admins MAY override per-entitlement to grant the newer version (audit-logged) — used for quality remedies, not as a default. Old `ProductFile` versions are kept in S3 (never overwritten) so prior buyers always have a working file.

**Rationale**: Q1 outcome. Storing the pinned version on the entitlement is the cleanest model and makes the override explicit when it happens.

**Alternatives considered**:
- **Always serve latest**: rejected by Q1.
- **Mark old versions for deletion after N days**: breaks A11's "lifetime of entitlements" guarantee.

---

## 16. Refund timing — pre-download flag (FR-048, A4, Q2)

**Decision**: `Entitlement.firstAccessedAt` is set to NOW the first time a download token mints a presigned URL for that entitlement. The refund-request endpoint and admin UI show "Refundable: yes" when `firstAccessedAt IS NULL`, otherwise "Discretionary". Issuing a refund always succeeds in Stripe; whether the entitlement is auto-revoked is policy-driven by the same `firstAccessedAt`.

**Rationale**: Q2 outcome — unconditional refund before first download, no time limit; post-download = goodwill only. Persisting `firstAccessedAt` makes the policy enforceable without manual review.

**Alternatives considered**:
- **Time-window refund (e.g., 14d)**: rejected by Q2.

---

## 17. Data retention (FR-054, A12, Q4)

**Decision**: Add a nightly cron (Vercel Cron) `data-retention.ts` that:
- Anonymizes `Customer.email` and PII fields on rows whose related orders are all > 7 years old (Dutch fiscal AWR).
- Deletes `AnalyticsEvent` rows older than 24 months.
- Leaves `Order`, `Refund`, `WebhookEventLog` tax-relevant fields intact for 7 years.

**Rationale**: Q4 outcome. Anonymization (not deletion) of the customer row preserves referential integrity to historical orders that the fiscal record still requires; the privacy policy describes this trade-off.

---

## 18. Observability (Constitution V, FR-049)

**Decision**: Use the existing structured logger in `apps/web` (pino-style) with these correlation IDs across the commerce path: `request_id`, `checkout_session_id`, `stripe_event_id`, `order_id`, `entitlement_id`, `download_token_id`. Emit FR-049 events to the new `AnalyticsEvent` table; mirror to Microsoft Clarity client-side for the page-view / CTA events. Vercel Web Analytics provides traffic baseline.

**Rationale**: Reuses existing logging conventions (Principle V); database-backed events make admin revenue-by-domain reports trivial (FR-050) without a separate warehouse.

---

## 19. Testing strategy

**Decision**:
- **Unit (Vitest)**: pricing authority, token mint/verify/expire/revoke, fulfillment idempotency, feed serializer, webhook signature verification, attribution cookie roundtrip.
- **Contract (Vitest + ajv)**: every public route under `contracts/schemas/*.schema.json` is asserted in CI by hitting the route in a test server and validating the JSON.
- **E2E (Playwright)**: happy-path purchase (Stripe test mode), library recovery via Clerk email-link, expired-token flow, admin refund flow, agent-API end-to-end checkout.
- **Webhook replay**: `stripe trigger` + `stripe events resend <id>` in CI to cover redelivery idempotency.

**Rationale**: Three-tier pyramid; contract tests give the agent API stability guarantees that the Constitution's "Clean Integration Boundaries" principle implicitly demands.

---

## 20. Out of research scope (deferred to implementation or later phase)

- **CDN cache invalidation when products archive** — handled via Next.js `revalidatePath` at admin-action time (no research needed).
- **Multi-currency** — A3 says EUR-only at launch; USD added later behind a per-product pricing matrix; no schema changes blocking that path.
- **Subscription / recurring billing** — explicitly out of scope (A10).
- **ACP adapter** — out of scope (A9); the agent API already exposes the primitives ACP will need.

---

## Summary

All Technical Context items are resolved. No `NEEDS CLARIFICATION` markers remain. Ready for Phase 1.
