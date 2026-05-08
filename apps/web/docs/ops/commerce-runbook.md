# Commerce ops runbook (T112)

Operational procedures for the CopyPasteLearn agentic-commerce platform.
This document is the authoritative source for non-developer admin / on-call
operations.

## 1. Refund a buyer

**When**: A buyer requests a refund (via support, agent
`POST /api/agent/refund-request`, or directly in admin UI).

**Steps**:

1. Sign in to `/admin/orders` (admin role required).
2. Search by buyer email or Stripe Checkout Session id.
3. Open the order. Verify:
   - `firstAccessedAt` is null (pre-download → unconditional refund per
     A4) or set (post-download → goodwill refund).
   - All entitlements show `ACTIVE`.
4. Click **Refund**. Select full or partial amount. Add a short reason
   string (logged on the `Refund` row).
5. The system:
   - Calls `stripe.refunds.create` (idempotency key = order id).
   - Sets every entitlement on the order to `REFUNDED`.
   - Sends `RefundConfirmationEmail` to the buyer via Resend.
   - Records `refund_completed` analytics with the actor id.
6. Verify the refund appears on the Stripe dashboard within ~30 sec.

**Rollback**: If a refund was issued in error, re-grant entitlements via
admin order detail (sets status back to `ACTIVE`) and document the
reason in the refund's notes field.

## 2. Replay a Stripe webhook

**When**:

- Webhook reconciler cron logs
  `cron.webhook-reconciler.paid-but-not-fulfilled`.
- A payment succeeded in Stripe but no order/entitlements appear after
  ~10 minutes.

**Steps**:

1. Open the [Stripe Dashboard](https://dashboard.stripe.com/) →
   Developers → Webhooks → endpoint
   `https://<domain>/api/webhooks/stripe`.
2. Find the relevant event (filter by `evt_…` id from the cron log).
3. Click **Resend**.
4. Confirm in Vercel logs:
   `webhook.stripe.checkout.session.completed` info line with
   matching `event_id`. Idempotency check (FR-020) ensures no duplicate
   side effects if the event was previously processed partially.
5. If the event is missing from Stripe entirely, escalate (the
   storefront did NOT receive a payment confirmation; do not grant
   access manually without a paid Stripe charge).

## 3. Pin a buyer to a newer file version (A11 override)

**When**: An admin chooses to grant a newer file version to an existing
buyer (e.g., to remedy a defect). The default policy (A11 / FR-028) is
that buyers retain only the version current at purchase time.

**Steps**:

1. Sign in to `/admin/products/<id>` and confirm the new file version is
   current.
2. Navigate to the buyer's order page.
3. Click **Re-pin entitlement to current version** on the entitlement
   row. The system:
   - Updates `entitlement.fileVersionId` to the new current file.
   - Records an `entitlement.repin` admin action in `AuditLog`.
   - Optionally emails the buyer with the new download link.
4. Document the reason in the AuditLog payload (defect, customer
   service goodwill, etc.).

## 4. Investigate download abuse

**When**: Suspected token sharing or abnormal download volume.

**Queries** (Postgres, against the prod replica):

```sql
-- Top tokens by download count in the last 7 days
SELECT t.id, t."entitlementId", COUNT(d.id) AS downloads
FROM "DownloadToken" t
LEFT JOIN "DownloadEvent" d ON d."tokenId" = t.id
WHERE t."issuedAt" > now() - interval '7 days'
GROUP BY t.id
ORDER BY downloads DESC
LIMIT 50;

-- IPs hitting the same entitlement
SELECT d."ipAddress", COUNT(*) AS hits
FROM "DownloadEvent" d
WHERE d."entitlementId" = '<entitlement-id>'
  AND d."createdAt" > now() - interval '24 hours'
GROUP BY d."ipAddress"
ORDER BY hits DESC;
```

**Action**: Revoke specific tokens via the admin UI
(`Library → Revoke token`). The buyer can regenerate from
`/library` (FR-025). Persistent abuse → escalate and consider
revoking all tokens on the entitlement.

## 5. Toggle Stripe Shared Payment Tokens (SPT)

**Default**: `ENABLE_STRIPE_SPT=false` (per FR-043 / SC-015).

**To enable** (only after legal/commercial sign-off per A1):

1. Set `ENABLE_STRIPE_SPT=true` in Vercel env (Production scope).
2. Redeploy or wait ≤ 5 minutes for the capabilities + UCP cache to
   refresh.
3. Verify `GET /api/agent/capabilities` reports
   `checkout.stripe_shared_payment_token: true`.
4. Verify `GET /.well-known/ucp` reports
   `payments.future_supported_flow: "shared_payment_token"`.

⚠ The SPT provider stub today rejects every request with
`unsupported_payment_method` (FR-044 deferred). Real validation logic
must be implemented before flipping the flag in production.

## 6. Rate-limit incident response

**Buckets** (`apps/web/src/lib/ratelimit.ts`):

- `agent:ip` — 60 req/min — agent endpoints.
- `feed:ip` — 30 req/min — `/feeds/products.json`.
- `download:ip` — 30 req/min · `download:token` — 100 req/min.
- `regenerate:user` — 10 req / 10 min — token regeneration.
- `assistant:ip` — 30 req/min — on-site assistant.

**To raise a ceiling temporarily**: edit the corresponding bucket in
`apps/web/src/lib/ratelimit.ts` and redeploy. Document the change in
the AuditLog and revert when the spike subsides.

## 7. Data-retention cron health check

The retention cron runs nightly at 03:00 UTC
(`/api/cron/data-retention`). On-call should verify:

- `cron.data-retention.completed` info line in Vercel logs.
- `summary.analyticsEventsDeleted` and `summary.downloadTokensRevoked`
  reflect non-zero values during steady state.

Failures (`*-failed` lines) require investigation but are non-blocking
for buyer flows.

## 8. Escalation contacts

- **Stripe billing/disputes**: Stripe Dashboard → Support.
- **Resend deliverability**: Resend Dashboard → Logs.
- **Infra (Vercel)**: Vercel Dashboard → Project → Logs.
- **DPO / GDPR requests**: support email per `COMMERCE_SUPPORT_EMAIL`.
