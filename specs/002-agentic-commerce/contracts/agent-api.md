# Agent API

Programmatic surface for current and future commerce-protocol clients. At MVP, all read endpoints are public (rate-limited); write endpoints (`checkout`, `refund-request`) are anonymous because the buyer's payment authentication happens at Stripe.

---

## `GET /api/agent/capabilities`

Advertises merchant identity, supported flows, fulfillment, currencies, and support actions. Generated at request time from a single internal config so the document and runtime stay in sync (FR-037, SC-015).

**Response 200** — matches `schemas/agent-capabilities.schema.json`.

```json
{
  "merchant": {
    "name": "Open Empower B.V.",
    "store": "CopyPasteLearn",
    "country": "NL",
    "merchant_of_record": true,
    "support_email": "support@copypastelearn.com"
  },
  "checkout": {
    "stripe_checkout": true,
    "stripe_payment_intent": false,
    "stripe_shared_payment_token": false
  },
  "fulfillment": {
    "digital_download": true,
    "instant_delivery": true
  },
  "currencies": ["EUR"],
  "support": {
    "order_status": true,
    "refund_request": true
  },
  "endpoints": {
    "products": "https://copypastelearn.com/api/agent/products",
    "checkout": "https://copypastelearn.com/api/agent/checkout",
    "order_status": "https://copypastelearn.com/api/agent/orders/{order_id}",
    "refund_request": "https://copypastelearn.com/api/agent/refund-request"
  }
}
```

When `ENABLE_STRIPE_SPT=true` is set per account/region (FR-043), `checkout.stripe_shared_payment_token` becomes `true` and the document propagates within 5 minutes (SC-015).

---

## `GET /api/agent/products`

Same shape as `/api/products` but includes only catalog fields safe for programmatic clients (no admin or buyer-private fields). Supports `brand`, `category`, `type`, `limit`, `cursor`.

**Response 200** matches `schemas/product.schema.json` (array form). Never includes file URLs or Stripe IDs.

---

## `GET /api/agent/products/{id}`

Single product, same constraints as the public storefront route, never exposing file URLs.

---

## `POST /api/agent/checkout`

Initiates a server-validated checkout for an agent client.

**Request body** — matches `schemas/agent-checkout-request.schema.json`.

```json
{
  "items": [
    { "product_id": "terraformpilot_iac_playbook", "quantity": 1 }
  ],
  "customer": {
    "email": "buyer@example.com"
  },
  "payment": {
    "type": "stripe_checkout"
  },
  "metadata": {
    "agent_id": "optional-opaque-string"
  }
}
```

`payment.type` MUST be one of `stripe_checkout` (default) or `stripe_shared_payment_token` (rejected unless feature-flagged). Any other value → `400 unsupported_payment_method`.

**Response 200** — matches `schemas/agent-checkout-response.schema.json`.

For `stripe_checkout`:

```json
{
  "checkout_type": "redirect",
  "checkout_url": "https://checkout.stripe.com/c/...",
  "checkout_session_id": "cs_test_123",
  "merchant_of_record": "Open Empower B.V.",
  "delivery_type": "digital_download",
  "expires_at": "2026-05-08T00:30:00Z"
}
```

For `stripe_shared_payment_token` (when enabled):

```json
{
  "checkout_type": "completed",
  "order_id": "ord_123",
  "merchant_of_record": "Open Empower B.V.",
  "delivery_type": "digital_download",
  "amount": { "amount": "29.00", "currency": "EUR" }
}
```

**Errors**:
- `400` `invalid_request` — bad item, mismatched currency, archived product.
- `400` `unsupported_payment_method` — disabled flow requested (FR-043 behavior).
- `402` `payment_failed` — for SPT path only; token rejected by provider.
- `429` rate-limited.

**Server-side validation (FR-006, FR-044)**:
- Each `product_id` resolved from DB; archived/draft → reject.
- Currency consistency across items.
- For SPT (when enabled): provider validates token authenticity, seller scope, currency match, amount ≤ token scope, expiry, and that the cart hash has not changed since approval.

**Never** does the agent API expose protected file URLs.

---

## `GET /api/agent/orders/{id}`

Public-by-ID-only order status for agent clients. Returns minimal, non-sensitive fields.

**Response 200**

```json
{
  "id": "ord_123",
  "status": "PAID",
  "total": { "amount": "29.00", "currency": "EUR" },
  "items": [
    { "product_id": "ansiblepilot_automation_playbook", "title": "Ansible Automation Playbook" }
  ],
  "delivery": {
    "type": "digital_download",
    "status": "available"
  },
  "created_at": "2026-05-08T00:00:00Z"
}
```

Excludes: customer email, payment intent IDs, attribution. Files are reachable only by the buyer through the buyer-scoped library.

`404` for unknown IDs (no enumeration).

---

## `POST /api/agent/refund-request`

Records a refund request from an agent client. Creates a `Refund` with status `pending` and `initiatedBy: "buyer"`; admin must approve in admin UI (FR-032). Auto-approval is **not** done from this endpoint.

**Request body**

```json
{
  "order_id": "ord_123",
  "reason": "wrong product",
  "contact_email": "buyer@example.com"
}
```

**Response 202**

```json
{
  "request_id": "rfr_abc",
  "status": "pending"
}
```

**Errors**: `404` if order not found; `409` if order not in a refundable state.

---

## `GET /.well-known/ucp`

UCP discovery placeholder (FR-039). Returns merchant + capability + endpoint pointers + payment-flow status. Schema: `schemas/ucp-discovery.schema.json`.

```json
{
  "merchant": {
    "name": "Open Empower B.V.",
    "store": "CopyPasteLearn",
    "website": "https://copypastelearn.com",
    "country": "NL",
    "support_email": "support@copypastelearn.com",
    "merchant_of_record": true
  },
  "capabilities": {
    "product_discovery": "https://copypastelearn.com/api/agent/products",
    "checkout":          "https://copypastelearn.com/api/agent/checkout",
    "order_status":      "https://copypastelearn.com/api/agent/orders/{order_id}",
    "refund_request":    "https://copypastelearn.com/api/agent/refund-request"
  },
  "fulfillment": {
    "type": "digital_download",
    "delivery_time": "instant"
  },
  "payments": {
    "provider": "stripe",
    "current_flow": "stripe_checkout",
    "future_supported_flow": "shared_payment_token"
  }
}
```

The document MUST NOT claim third-party production approval.
