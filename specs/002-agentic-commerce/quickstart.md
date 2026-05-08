# Quickstart: Agentic Commerce — Local Development

**Feature**: 002-agentic-commerce
**Audience**: Developers running the storefront locally and exercising the end-to-end purchase, library, refund, agent, and feed flows.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS | matches existing apps/web |
| pnpm | 9+ | monorepo package manager |
| Stripe CLI | latest | webhook forwarding & event triggering |
| AWS CLI (or compatible) | latest | local S3 / R2 setup; or use MinIO |
| Docker (optional) | latest | for local Postgres + MinIO if you don't use a managed dev DB |

---

## 1. Environment

Create `apps/web/.env.local`:

```env
# Database (existing)
DATABASE_URL=postgres://...
DIRECT_URL=postgres://...

# Clerk (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe (NEW)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...      # populated by `stripe listen` below
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Object storage for protected files (NEW)
COMMERCE_S3_REGION=eu-west-1
COMMERCE_S3_BUCKET=copypastelearn-files-dev
COMMERCE_S3_ACCESS_KEY_ID=...
COMMERCE_S3_SECRET_ACCESS_KEY=...
COMMERCE_S3_ENDPOINT=                # leave blank for AWS S3; set for MinIO/R2

# Transactional email (NEW)
RESEND_API_KEY=re_...
COMMERCE_EMAIL_FROM="CopyPasteLearn <noreply@copypastelearn.com>"

# Rate limiting (NEW)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Feature flags (NEW) — DO NOT enable SPT in MVP
ENABLE_STRIPE_SPT=false

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Schema migration

```bash
cd apps/web
pnpm db:generate
pnpm db:migrate    # creates Product, Bundle, Order, Entitlement, DownloadToken, etc.
```

---

## 3. Seed a test product

```bash
pnpm tsx prisma/seed.commerce.ts
```

Creates one published product (`ansible-automation-playbook`, €29 EUR), one published bundle (`devops-copy-paste-bundle`, €59 EUR), the four MVP policy documents, and uploads `seed/files/sample.pdf` to the S3 bucket as the product's `ProductFile` v1.0.

> If you don't have S3 credentials, run `docker compose -f docker/dev.yml up minio` first; the seed script auto-creates the bucket.

---

## 4. Stripe products & prices

The seed script also calls Stripe to create matching `prod_...` and `price_...` and writes the IDs to the local DB. Verify with:

```bash
stripe products list --limit 5
```

Stripe Tax must be enabled in the test account (Dashboard → Tax → Activate). Set the country to NL and add the EU OSS preset.

---

## 5. Webhook forwarding

In a separate terminal:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` and put it in `STRIPE_WEBHOOK_SECRET`.

---

## 6. Run the app

```bash
pnpm dev
```

Visit:

- `http://localhost:3000/shop` — catalog index
- `http://localhost:3000/products/ansible-automation-playbook` — product detail
- `http://localhost:3000/feeds/products.json` — product feed
- `http://localhost:3000/api/agent/capabilities` — agent capabilities
- `http://localhost:3000/.well-known/ucp` — UCP discovery placeholder

---

## 7. End-to-end test purchase

1. Open the product page and click **Buy**.
2. On Stripe Checkout, use card `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.
3. Complete payment. You will be redirected to `/checkout/success?session_id=cs_test_...`.
4. The Stripe CLI terminal will print `checkout.session.completed` and the local server log will show the order, entitlement, and download token being created within ~1s.
5. Check your inbox (or the Resend test inbox) for the confirmation email; the access link points to `/api/download/<token>`.
6. Click the access link → 302 redirects to a 60s presigned S3 URL → PDF downloads.
7. Sign in at `/library` with the same email used for purchase (Clerk magic link). Confirm the product appears.
8. Click **Get fresh download link** in the library; verify a new token is minted and old token returns 410 on use.

---

## 8. Agent E2E test

```bash
# 1. Capabilities
curl http://localhost:3000/api/agent/capabilities | jq

# 2. List products
curl 'http://localhost:3000/api/agent/products?brand=AnsiblePilot' | jq

# 3. Initiate checkout
curl -X POST http://localhost:3000/api/agent/checkout \
  -H 'Content-Type: application/json' \
  -d '{
        "items": [{"product_id":"ansiblepilot_automation_playbook","quantity":1}],
        "customer": {"email":"agent-buyer@example.com"},
        "payment": {"type":"stripe_checkout"}
      }' | jq

# Open the returned checkout_url in a browser to complete payment.

# 4. Order status
curl http://localhost:3000/api/agent/orders/ord_xxx | jq
```

Expect: SPT request rejected with `{"error":{"code":"unsupported_payment_method"}}` while `ENABLE_STRIPE_SPT=false`.

---

## 9. Refund flow

1. As admin (Clerk user with `role=ADMIN`), open `/admin/orders/ord_xxx`.
2. Click **Refund (full)**.
3. Confirm: a `charge.refunded` event arrives, the Order moves to `REFUNDED`, the entitlement to `REFUNDED` (because the buyer hadn't downloaded yet — `firstAccessedAt` was null).
4. The buyer receives a refund-confirmation email.

To test post-download refund: download the file first (sets `firstAccessedAt`), then refund. The entitlement remains `ACTIVE` unless you tick **Revoke access** in the admin form.

---

## 10. Webhook idempotency check

```bash
# Replay the last event
stripe events resend evt_xxx
```

Expected: server log shows `webhook.duplicate.skipped` and no second email is sent.

---

## 11. Contract tests

```bash
cd apps/web
pnpm test -- contract        # Vitest contract suite
pnpm test:e2e -- --grep agentic-commerce  # Playwright
```

All contract tests must pass against the JSON Schemas in `specs/002-agentic-commerce/contracts/schemas/`.

---

## 12. Production checklist (deferred until launch)

- [ ] Switch Stripe to live mode keys.
- [ ] Configure Stripe Tax in live mode (Dutch entity).
- [ ] DNS: `noreply@copypastelearn.com` SPF/DKIM/DMARC.
- [ ] S3 bucket: `BlockPublicAccess` confirmed; lifecycle keeps old `ProductFile` versions indefinitely.
- [ ] Vercel Cron: `data-retention.ts` scheduled nightly.
- [ ] Vercel Cron: `webhook-reconciler.ts` scheduled every 15 minutes.
- [ ] External synthetic monitoring (UptimeRobot or similar) on `/`, `/shop`, `/feeds/products.json`, `/api/agent/capabilities`, `/.well-known/ucp` for the 99.0% SLO (SC-016).
- [ ] Refund/terms/privacy/digital-delivery policy documents reviewed and published.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `400` on `POST /api/checkout/stripe` with `invalid_request` | Product is `DRAFT`/`ARCHIVED` or `stripePriceId` not set. |
| Webhook `400 signature_failed` | `STRIPE_WEBHOOK_SECRET` mismatch. Re-copy from `stripe listen` output. |
| `/api/download/<token>` returns 410 | Token expired (>24h) or download cap reached (>3). Use library to regenerate. |
| `/feeds/products.json` includes archived items | Edge cache stale; admin action should have called `revalidatePath`. Force with `?bust=<random>` once. |
| Library is empty after purchase | Buyer's Clerk email differs from purchase email; the link is still pending. Sign out and sign in with the purchase email. |
