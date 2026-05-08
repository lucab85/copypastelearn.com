# Phase 1 Data Model: Agentic Commerce

**Feature**: 002-agentic-commerce
**Date**: 2026-05-08
**Storage**: PostgreSQL via Prisma 5+ (extends existing `apps/web/prisma/schema.prisma`)

This document specifies the new entities, fields, indexes, and relationships introduced by this feature. Implementation MUST follow this model; deviations require an updated plan and constitution check.

---

## Entity overview

```text
                       ┌──────────────┐
                       │ PolicyDoc    │   (terms / refund / delivery / privacy — versioned)
                       └──────────────┘

User (existing, Clerk-synced)
  │
  ▼
Customer ──┐
  │        │
  ▼        ▼
Order ── OrderItem ──► Product ──► ProductFile (versioned, private S3 keys)
  │         (or)  ──► Bundle ────► Product (many-to-many via BundleItem)
  │
  ├──► Entitlement (one per Product per Order; pinned to ProductFile.version)
  │       │
  │       └──► DownloadToken (short-lived, hashed, count-limited)
  │
  ├──► Refund (mirrors Stripe charge.refunded)
  │
  └──► attribution: source domain, UTM, channel  (denormalized on Order)

WebhookEventLog          (idempotency: provider + event_id UNIQUE)
AnalyticsEvent           (FR-049)
AdminAuditEvent          (FR-031)
EmailJob                 (transactional email retry queue)
```

---

## Models (Prisma DSL)

```prisma
// ─── Commerce: Catalog ─────────────────────────────────────

model Product {
  id             String          @id @default(cuid())
  slug           String          @unique
  title          String
  subtitle       String?
  description    String          // long-form, markdown allowed
  brand          Brand
  sourceDomains  String[]        // e.g. ["ansiblepilot.com","ansiblebyexample.com"]
  productType    ProductType
  formats        String[]        // ["PDF","ZIP","MP4"]
  categories     String[]        // ["ansible","devops"]
  tags           String[]
  priceAmount    Int             // minor units (cents)
  currency       String          // ISO 4217; "EUR" at launch (A3)
  stripeProductId String?
  stripePriceId  String?
  taxCode        String          // Stripe tax code (e.g. "txcd_10501000")
  imageUrl       String?
  canonicalUrl   String          // absolute URL on storefront
  metaTitle      String?
  metaDescription String?
  status         ContentStatus   @default(DRAFT)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  files          ProductFile[]
  orderItems     OrderItem[]
  entitlements   Entitlement[]
  bundleItems    BundleItem[]

  @@index([status])
  @@index([brand])
  @@index([slug])
}

enum Brand {
  CopyPasteLearn
  AnsiblePilot
  TerraformPilot
  AnsibleByExample
  KubernetesRecipes
}

enum ProductType {
  EBOOK
  TEMPLATE
  COURSE      // file-based course per A2
  BUNDLE      // virtual; real bundles use the Bundle table
}

// (ContentStatus enum — DRAFT/PUBLISHED — already exists in schema; reuse it
//  and add ARCHIVED if not already present.)

model ProductFile {
  id          String   @id @default(cuid())
  productId   String
  version     String   // semver-ish; e.g. "1.0", "1.1", "2.0"
  label       String   // "PDF ebook", "Code samples"
  s3Bucket    String
  s3Key       String   // private object key
  byteSize    BigInt?
  contentType String?  // MIME
  isCurrent   Boolean  @default(false)
  createdAt   DateTime @default(now())

  product       Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  entitlements  Entitlement[] @relation("PinnedFile")

  @@unique([productId, version])
  @@index([productId, isCurrent])
}

model Bundle {
  id             String        @id @default(cuid())
  slug           String        @unique
  title          String
  description    String
  brand          Brand         @default(CopyPasteLearn)
  priceAmount    Int
  currency       String
  stripeProductId String?
  stripePriceId  String?
  taxCode        String
  imageUrl       String?
  canonicalUrl   String
  status         ContentStatus @default(DRAFT)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  items          BundleItem[]
  orderItems     OrderItem[]

  @@index([status])
  @@index([slug])
}

model BundleItem {
  bundleId  String
  productId String
  bundle    Bundle  @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@id([bundleId, productId])
}

// ─── Commerce: Customer & Orders ────────────────────────────

model Customer {
  id               String   @id @default(cuid())
  userId           String?  @unique  // Clerk-linked User.id (nullable: pre-account purchases)
  email            String
  country          String?
  stripeCustomerId String?  @unique
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  orders        Order[]
  entitlements  Entitlement[]

  @@index([email])
}

model Order {
  id                       String          @id @default(cuid())
  customerId               String
  status                   OrderStatus     @default(PENDING)
  subtotalAmount           Int
  taxAmount                Int             @default(0)
  totalAmount              Int
  currency                 String

  // Payment provider fields (FR-042 — abstraction allows these to be Stripe today, other later)
  paymentProvider          String          @default("stripe")
  paymentMethod            PaymentMethod   @default(STRIPE_CHECKOUT)
  stripeCheckoutSessionId  String?         @unique
  stripePaymentIntentId    String?         @unique

  // Attribution (FR-018)
  sourceDomain             String?
  utmSource                String?
  utmMedium                String?
  utmCampaign              String?
  channel                  String?         // "storefront" | "agent" | "chat"

  createdAt                DateTime        @default(now())
  updatedAt                DateTime        @updatedAt

  customer                 Customer        @relation(fields: [customerId], references: [id])
  items                    OrderItem[]
  entitlements             Entitlement[]
  refunds                  Refund[]

  @@index([customerId])
  @@index([status])
  @@index([sourceDomain])
}

enum OrderStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentMethod {
  STRIPE_CHECKOUT
  STRIPE_PAYMENT_INTENT
  STRIPE_SHARED_PAYMENT_TOKEN  // FR-043 — feature-flagged, never default
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String?
  bundleId    String?
  quantity    Int     @default(1)
  unitAmount  Int
  currency    String

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id])
  bundle  Bundle?  @relation(fields: [bundleId], references: [id])

  @@index([orderId])
}

// ─── Commerce: Entitlements & Tokens ───────────────────────

model Entitlement {
  id              String           @id @default(cuid())
  customerId      String
  orderId         String
  productId       String
  pinnedFileId    String?          // ProductFile pinned at fulfillment (A11/Q1)
  status          EntitlementStatus @default(ACTIVE)
  grantedAt       DateTime         @default(now())
  firstAccessedAt DateTime?        // set on first download — drives refund regime (Q2)
  revokedAt       DateTime?
  revocationReason String?

  customer    Customer       @relation(fields: [customerId], references: [id])
  order       Order          @relation(fields: [orderId], references: [id])
  product     Product        @relation(fields: [productId], references: [id])
  pinnedFile  ProductFile?   @relation("PinnedFile", fields: [pinnedFileId], references: [id])
  tokens      DownloadToken[]

  @@unique([orderId, productId])
  @@index([customerId])
  @@index([status])
}

enum EntitlementStatus {
  ACTIVE
  REVOKED
  REFUNDED
}

model DownloadToken {
  id            String    @id @default(cuid())
  entitlementId String
  tokenHash     String    @unique          // SHA-256 of the random 32-byte token
  expiresAt     DateTime                    // 24h after issue (Q3)
  downloadCount Int       @default(0)
  maxDownloads  Int       @default(3)       // (Q3)
  revokedAt     DateTime?
  createdAt     DateTime  @default(now())
  lastUsedAt    DateTime?

  entitlement Entitlement @relation(fields: [entitlementId], references: [id], onDelete: Cascade)

  @@index([entitlementId])
  @@index([expiresAt])
}

// ─── Commerce: Refunds ─────────────────────────────────────

model Refund {
  id                 String   @id @default(cuid())
  orderId            String
  amount             Int
  currency           String
  reason             String?
  initiatedBy        String   // "buyer" | "admin" | "stripe"
  stripeRefundId     String?  @unique
  status             String   // "pending" | "succeeded" | "failed"
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  order Order @relation(fields: [orderId], references: [id])

  @@index([orderId])
}

// ─── Commerce: Idempotency, Audit, Analytics, Email ────────

model WebhookEventLog {
  id           String   @id @default(cuid())
  provider     String   // "stripe"
  eventId      String
  eventType    String
  receivedAt   DateTime @default(now())
  processedAt  DateTime?
  payloadHash  String?  // optional sha256 of raw payload for forensics

  @@unique([provider, eventId])
  @@index([provider, eventType, receivedAt])
}

model AnalyticsEvent {
  id            String   @id @default(cuid())
  type          String   // FR-049 enumeration; e.g. "checkout_completed"
  customerId    String?
  orderId       String?
  productId     String?
  bundleId      String?
  sourceDomain  String?
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  metadata      Json?
  createdAt     DateTime @default(now())

  @@index([type, createdAt])
  @@index([sourceDomain, createdAt])
  @@index([orderId])
}

model AdminAuditEvent {
  id          String   @id @default(cuid())
  actorId     String                       // Clerk user id
  action      String                       // "product.publish", "order.refund", ...
  targetType  String                       // "Product" | "Order" | "ProductFile" | ...
  targetId    String
  payload     Json?
  createdAt   DateTime @default(now())

  @@index([actorId, createdAt])
  @@index([targetType, targetId])
}

model EmailJob {
  id           String   @id @default(cuid())
  to           String
  template     String
  payload      Json
  attempts     Int      @default(0)
  status       String   @default("queued")  // queued | sent | failed
  lastError    String?
  scheduledAt  DateTime @default(now())
  sentAt       DateTime?

  @@index([status, scheduledAt])
}

model PolicyDocument {
  id        String   @id @default(cuid())
  slug      String   // "terms" | "refund-policy" | ...
  version   String
  bodyMd    String
  isCurrent Boolean  @default(false)
  publishedAt DateTime @default(now())

  @@unique([slug, version])
  @@index([slug, isCurrent])
}
```

---

## Validation rules

| Field / rule | Constraint |
|---|---|
| `Product.slug`, `Bundle.slug` | unique, kebab-case, immutable after first publish |
| `Product.priceAmount`, `Bundle.priceAmount` | positive integer, minor units |
| `Product.currency`, `Order.currency`, `OrderItem.currency`, `Refund.currency` | ISO 4217; MUST match across an Order's items |
| `Product.stripePriceId`, `Bundle.stripePriceId` | required when `status = PUBLISHED` (FR-005) |
| `Product.taxCode`, `Bundle.taxCode` | required when `status = PUBLISHED` (FR-005) |
| `ProductFile.isCurrent` | exactly one true row per `productId` (enforced at app + via partial unique index in migration) |
| `Entitlement` | UNIQUE(orderId, productId) — guarantees no duplicate grants per order on webhook redelivery |
| `DownloadToken.tokenHash` | UNIQUE — never store raw token |
| `WebhookEventLog` | UNIQUE(provider, eventId) — idempotency invariant |
| `Order.totalAmount` | MUST equal `subtotalAmount + taxAmount` |
| `OrderItem` | exactly one of `productId` / `bundleId` non-null (enforce in app + DB CHECK) |
| `PolicyDocument.isCurrent` | at most one true per `slug` |

---

## State transitions

### Order

```text
PENDING ──► PAID                  (on checkout.session.completed, payment_status=paid)
PENDING ──► EXPIRED               (on checkout.session.expired)
PENDING ──► FAILED                (on payment_intent.payment_failed)
PAID    ──► PARTIALLY_REFUNDED    (on partial charge.refunded)
PAID    ──► REFUNDED              (on full charge.refunded)
```

Disallowed: any transition out of `EXPIRED` / `FAILED` / `REFUNDED`.

### Entitlement

```text
ACTIVE ──► REVOKED   (admin action; logs reason)
ACTIVE ──► REFUNDED  (full refund + pre-download OR refund + admin policy choice)
REVOKED ──► (terminal)
REFUNDED ──► (terminal)
```

### DownloadToken

```text
created ──► (used 0..N times, N ≤ maxDownloads) ──► consumed (count == max)
                                              └──► expired (now > expiresAt)
                                              └──► revoked (admin or buyer-regenerate)
```

Buyer-regenerate from library: revoke all existing tokens for the entitlement, mint a fresh one.

---

## Indexes summary

| Model | Index | Purpose |
|---|---|---|
| Product | `(status)`, `(brand)`, `(slug)` | catalog filters; product lookup |
| Bundle | `(status)`, `(slug)` | catalog filters |
| Customer | `(email)` | admin lookup (FR-032) |
| Order | `(customerId)`, `(status)`, `(sourceDomain)` | library, admin, attribution reports (FR-050) |
| Entitlement | `(customerId)`, `(status)` | library |
| DownloadToken | `(entitlementId)`, `(expiresAt)` | library + nightly cleanup |
| WebhookEventLog | `(provider, eventType, receivedAt)` | ops queries |
| AnalyticsEvent | `(type, createdAt)`, `(sourceDomain, createdAt)` | KPI queries |
| AdminAuditEvent | `(actorId, createdAt)`, `(targetType, targetId)` | audit |

---

## Relationship to existing schema

- `User` (existing, Clerk-synced) ←→ `Customer` via `Customer.userId`. Pre-account purchases (buyer hadn't signed up before paying) leave `userId` null and are linked when the buyer later signs in with the same email.
- `Subscription` (existing) is unrelated to commerce orders. They coexist on `User`.
- No existing model is modified beyond optionally extending the `ContentStatus` enum if `ARCHIVED` is missing.

---

## Open data-model questions

None. All FRs from spec.md and resolved clarifications (Q1–Q5) are covered. Implementation may add view models / DTOs as needed.
