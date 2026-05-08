# Public Storefront API

Routes serving the storefront UI and authenticated buyer flows. These are stable internal APIs; any breaking change requires a new path or version.

---

## `GET /api/products`

List active products and bundles with optional filters. Cacheable.

**Query parameters**

| Name | Type | Notes |
|---|---|---|
| `brand` | string enum | `AnsiblePilot` \| `TerraformPilot` \| `AnsibleByExample` \| `KubernetesRecipes` \| `CopyPasteLearn` |
| `category` | string | e.g. `ansible`, `terraform`, `kubernetes`, `devops` |
| `type` | string enum | `EBOOK` \| `TEMPLATE` \| `COURSE` \| `BUNDLE` |
| `limit` | int | 1–100, default 50 |
| `cursor` | string | opaque pagination cursor |

**Response 200** — items each match `schemas/product.schema.json`.

```json
{
  "items": [
    {
      "id": "ansiblepilot_automation_playbook",
      "slug": "ansible-automation-playbook",
      "title": "Ansible Automation Playbook",
      "brand": "AnsiblePilot",
      "type": "EBOOK",
      "price": { "amount": "29.00", "currency": "EUR" },
      "availability": "in_stock",
      "url": "https://copypastelearn.com/products/ansible-automation-playbook",
      "image_url": "https://copypastelearn.com/images/ansible-automation-playbook.jpg"
    }
  ],
  "next_cursor": null
}
```

**Errors**: `429` if rate-limited.

---

## `GET /api/products/{id}`

Returns a single product or bundle by `id` or `slug`.

**Path**: `id` (string) — accepts either the product ID or slug.

**Response 200** — matches `schemas/product.schema.json`.

```json
{
  "id": "ansiblepilot_automation_playbook",
  "slug": "ansible-automation-playbook",
  "title": "Ansible Automation Playbook",
  "subtitle": "Copy-paste-ready Ansible workflows",
  "description": "...",
  "brand": "AnsiblePilot",
  "type": "EBOOK",
  "formats": ["PDF"],
  "categories": ["ansible","devops"],
  "price": { "amount": "29.00", "currency": "EUR" },
  "availability": "in_stock",
  "delivery_type": "digital_download",
  "image_url": "https://...",
  "url": "https://copypastelearn.com/products/ansible-automation-playbook",
  "refund_policy_url": "https://copypastelearn.com/refund-policy",
  "digital_delivery_policy_url": "https://copypastelearn.com/digital-delivery-policy",
  "seller_of_record": "Open Empower B.V.",
  "updated_at": "2026-05-08T00:00:00Z"
}
```

**Errors**: `404` if not found, archived, or draft.

---

## `POST /api/checkout/stripe`

Server-validates the requested items, creates a Stripe Checkout Session, returns a redirect URL. Server is the authority on price (FR-006).

**Request body**

```json
{
  "items": [
    { "product_id": "ansiblepilot_automation_playbook", "quantity": 1 }
  ],
  "customer_email": "buyer@example.com",
  "source_domain": "ansiblepilot.com",
  "utm": {
    "source": "ansiblepilot",
    "medium": "article_cta",
    "campaign": "automation_playbook"
  }
}
```

`items[].product_id` may be a Product or Bundle ID. `customer_email` is optional; Stripe collects it if omitted.

**Response 200**

```json
{
  "checkout_session_id": "cs_test_123",
  "checkout_url": "https://checkout.stripe.com/c/...",
  "expires_at": "2026-05-08T00:30:00Z"
}
```

**Errors**:
- `400` `invalid_request` — bad item ID, archived product, currency mismatch.
- `404` `not_found` — unknown product/bundle.
- `409` `unavailable` — product currently `DRAFT`/`ARCHIVED`.
- `429` rate-limited.

**Behavior**:
- Loads each `items[].product_id` from DB; rejects if `status != PUBLISHED`.
- Resolves each item to its `stripePriceId` and `quantity`.
- Creates `Order` row with status `PENDING` and the attribution fields.
- Calls `stripe.checkout.sessions.create({ mode: 'payment', line_items, automatic_tax: { enabled: true }, metadata: { order_id, source_domain, utm_* } })`.
- Persists `stripeCheckoutSessionId` on the Order.
- Emits `checkout_session_created` analytics event.

---

## `GET /api/orders/{id}`

Buyer-scoped order lookup. Requires Clerk auth; returns 404 if the authenticated user does not own the order (no information leak).

**Response 200**

```json
{
  "id": "ord_123",
  "status": "PAID",
  "total": { "amount": "29.00", "currency": "EUR" },
  "items": [
    {
      "product_id": "ansiblepilot_automation_playbook",
      "title": "Ansible Automation Playbook",
      "quantity": 1
    }
  ],
  "delivery": {
    "type": "digital_download",
    "status": "available"
  },
  "created_at": "2026-05-08T00:00:00Z"
}
```

Excludes: payment-intent details, raw Stripe IDs, customer PII not belonging to the caller.

---

## `GET /api/download/{token}`

Validates a download token, increments its count, and 302-redirects to a 60-second presigned S3 GET URL. The token is opaque base64url; never logged.

**Path**: `token` — opaque string.

**Response**:
- `302 Found` with `Location: <presigned-s3-url>` — token valid; download proceeds.
- `410 Gone` — token expired or download cap reached. Body links to library to regenerate.
- `403 Forbidden` — token revoked.
- `404 Not Found` — unknown token (no enumeration).
- `429 Too Many Requests` — per-IP or per-token rate limit hit.

**Side effects**:
- Increments `DownloadToken.downloadCount`, sets `lastUsedAt`.
- On the entitlement's first successful download, sets `Entitlement.firstAccessedAt = now()` (drives Q2 refund regime).
- Emits `file_downloaded` analytics event.
- Logs every attempt (success/expired/revoked) per FR-026.

---

## Schemas

- [schemas/product.schema.json](schemas/product.schema.json)
- [schemas/error.schema.json](schemas/error.schema.json)
