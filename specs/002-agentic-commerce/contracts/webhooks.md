# Stripe Webhooks

`POST /api/webhooks/stripe` — receives raw Stripe events and dispatches to the fulfillment pipeline. This route is the most security-sensitive in the system.

## Security

1. Read raw body (Next.js: `await req.text()` before any JSON parsing).
2. Verify signature with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`. Reject `400` on failure.
3. Lookup `WebhookEventLog` by `(provider='stripe', eventId=event.id)`; if exists → return `200` immediately (idempotency, FR-020/SC-003).
4. Insert the `WebhookEventLog` row inside the same transaction as fulfillment side effects.

This endpoint is **not** rate-limited (Stripe must always be able to redeliver) but is gated by signature verification.

## Event matrix

| Event | Action | Notes |
|---|---|---|
| `checkout.session.completed` | If `payment_status === 'paid'`, call `fulfill(session)`: upsert Customer (link to Clerk User by email), set Order → `PAID`, store `stripePaymentIntentId`, create one Entitlement per Product (and per Product inside a Bundle) pinning `ProductFile.isCurrent`, create initial DownloadToken per entitlement, queue confirmation EmailJob, emit `checkout_completed` analytics event. | FR-020, FR-021. |
| `payment_intent.succeeded` | No-op for Checkout flow (Order is already PAID). For future SPT path: same fulfillment as above. | FR-042. |
| `payment_intent.payment_failed` | Set Order → `FAILED`. Emit `checkout_abandoned` analytics. | FR-022. |
| `checkout.session.expired` | Set Order → `EXPIRED`. | FR-022. |
| `charge.refunded` | Look up Order via `payment_intent`. Insert Refund row mirroring Stripe. If `amount_refunded === total` → Order `REFUNDED`; else `PARTIALLY_REFUNDED`. Update Entitlement(s): if `firstAccessedAt IS NULL` → `REFUNDED`; else keep `ACTIVE` unless admin override. Queue refund-confirmation EmailJob. | FR-023, A4 (Q2). |
| (any other) | Log to `WebhookEventLog`, return `200`. | |

## Response

- `200 OK` with empty body on success or duplicate.
- `400 Bad Request` on signature verification failure (no body details — avoid information leak).
- `500` only on truly unexpected errors (Stripe will retry).

## Idempotency invariants

- `WebhookEventLog (provider, eventId)` UNIQUE.
- `Entitlement (orderId, productId)` UNIQUE — duplicate fulfillment cannot grant duplicate entitlements.
- `Order.stripeCheckoutSessionId` UNIQUE — duplicate completion cannot create a second order.
- `Refund.stripeRefundId` UNIQUE.

## Out-of-order events

If `charge.refunded` arrives before `checkout.session.completed`:

1. The handler stores the WebhookEventLog row but cannot yet locate the Order.
2. Returns `200` (acknowledged) without applying the refund.
3. A nightly reconciler scans WebhookEventLog rows with `processedAt IS NULL` older than 5 minutes and re-runs them. By that time the completion event has been delivered (Stripe guarantees eventual delivery within minutes).

This satisfies the spec's edge case requirement: "A webhook arrives out of order: the system must reconcile based on payment-provider state of record, not arrival order."
