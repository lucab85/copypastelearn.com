# Feature Specification: CopyPasteLearn Agentic Commerce Platform

**Feature Branch**: `002-agentic-commerce`  
**Created**: 2026-05-08  
**Status**: Draft  
**Input**: User description: "CopyPasteLearn Agentic Commerce Platform — unified storefront for selling technical ebooks, courses, templates, and bundles across Open Empower's DevOps learning portfolio (AnsiblePilot, TerraformPilot, Ansible by Example, Kubernetes Recipes). Launch with merchant-owned hosted checkout under Dutch Operating B.V., automatic digital delivery, structured product feed, and agent-ready APIs designed so that future agentic-commerce protocols (ACP, UCP, Shared Payment Tokens) can be added without rebuilding catalog, order, tax, or fulfillment systems."

## Clarifications

### Session 2026-05-08

- Q: File-update policy for prior buyers (FR-028) → A: Buyers receive the version current at purchase time only; new versions require re-purchase
- Q: Refund window before any download/access (FR-048, A4) → A: Unconditional refund any time before first download; no time limit
- Q: Download token lifetime and cap (FR-025) → A: 24-hour expiry, 3 downloads per token, regenerable from library
- Q: Personal data retention (FR-054) → A: Orders/invoices 7 years (Dutch fiscal); customer PII minimized after 7 years; analytics 24 months
- Q: Storefront/checkout uptime target (new SC) → A: 99.0% monthly (~7.2 h/month), best-effort

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Article reader buys an ebook through the central storefront (Priority: P1)

A DevOps learner reads a tutorial on a vertical content domain (e.g., AnsiblePilot or TerraformPilot), sees a contextual call-to-action for a related ebook, follows the link to a product page on the central storefront, completes hosted payment, and receives instant secure access to the digital file.

**Why this priority**: This is the core revenue path and the minimum viable product. Without it there is no commerce, no validation of demand, and no way to prove that existing content traffic converts to paid customers. Every other story exists to amplify or extend this flow.

**Independent Test**: Can be fully tested by publishing one product, placing one CTA on one external article, and completing one end-to-end purchase that results in a successful payment, an order record, an email with a working access link, and a downloadable file. Delivers measurable value the moment the first paid sale clears.

**Acceptance Scenarios**:

1. **Given** an active product is published with a price and downloadable file, **When** a visitor on a vertical domain article clicks the contextual CTA and completes hosted payment, **Then** the system records a paid order, sends a confirmation email containing a secure access link, and grants the buyer access to the file.
2. **Given** a buyer has just paid, **When** they land on the post-payment success page, **Then** they see the purchased product(s), a working access/download link, confirmation that an email has been sent, and a link to support.
3. **Given** a buyer's payment fails or is canceled at the payment provider, **When** they return to the storefront, **Then** no order is created, no access is granted, and the buyer can retry without duplicate charges.
4. **Given** a CTA click happened on a tracked vertical domain, **When** the order is recorded, **Then** the source domain and campaign attribution are stored on the order so revenue can be attributed by domain and article.

---

### User Story 2 - Buyer recovers and re-uses access to purchased content (Priority: P1)

After purchase, the buyer can return at any time, sign in with their purchase email, view all of their purchased products in an account library, and re-download files (including updated versions) without contacting support.

**Why this priority**: Without recoverable access, every lost email becomes a support ticket and a refund risk. A working library is required before refund policy and update policy can be enforced. It is mandatory for trust and for repeat purchases.

**Independent Test**: Can be fully tested by completing a purchase, clearing the original confirmation email, requesting a new sign-in link with the purchase email, signing in, and successfully downloading the purchased file from the account library.

**Acceptance Scenarios**:

1. **Given** a buyer has at least one paid order, **When** they request a sign-in link using their purchase email, **Then** they receive a one-time link that grants access to their library.
2. **Given** a buyer is signed in, **When** they open their library, **Then** they see all active entitlements with the latest available file version and a working download action.
3. **Given** a download access token has expired, **When** the buyer attempts to use it, **Then** they are guided to sign in or request a fresh link rather than being silently denied.
4. **Given** an admin publishes a new version of a product file, **When** prior buyers open their library, **Then** the new version is available to entitled buyers per policy without re-purchase.

---

### User Story 3 - Vertical domain converts article traffic to sales (Priority: P1)

Editorial pages on each vertical content domain render a contextual CTA module that links to the matching product or bundle on the central storefront, preserving source attribution so the business can measure article-to-purchase conversion.

**Why this priority**: The MVP's commercial thesis is that existing content traffic is the acquisition channel. Without functioning CTAs and attribution on at least the first two verticals (AnsiblePilot, TerraformPilot), the storefront cannot be validated commercially even if checkout works.

**Independent Test**: Can be fully tested by placing CTAs on at least two articles each on AnsiblePilot and TerraformPilot, generating clicks, and confirming that the resulting orders are attributed to the correct source domain, article, and campaign.

**Acceptance Scenarios**:

1. **Given** a CTA is configured for an article, **When** a reader views the article, **Then** the CTA renders without materially degrading page performance.
2. **Given** a reader clicks a vertical-domain CTA, **When** they reach the product page and complete checkout, **Then** the source domain, article identifier, and campaign metadata are persisted on the order.
3. **Given** at least one paid sale exists, **When** the admin views revenue reports, **Then** revenue can be broken down by source domain and by campaign.

---

### User Story 4 - Admin manages products, orders, and refunds without engineering help (Priority: P1)

A non-developer administrator can create and publish products and bundles, map them to payment-provider prices, assign tax classification, upload protected files, look up orders by buyer email or session reference, mark refunds, and revoke or reissue access.

**Why this priority**: After launch, the founder/admin must be able to publish new products and operate refunds on day one without redeploys. Without this capability, the launch is locked behind engineering bandwidth and cannot scale to multiple products.

**Independent Test**: Can be fully tested by an admin creating a new product end-to-end, publishing it, and processing one full refund cycle (refund → entitlement update → buyer notified) without any code change.

**Acceptance Scenarios**:

1. **Given** the admin is signed in with the appropriate role, **When** they create a new product with title, description, image, file, price-provider mapping, and tax code, **Then** the product can be previewed and published as active.
2. **Given** a buyer requests a refund, **When** the admin processes the refund, **Then** the system records the refund event, updates the entitlement per policy, and the buyer receives confirmation.
3. **Given** an admin uploads a new version of a product file, **When** they save the product, **Then** existing buyers' entitlements remain valid and the new version becomes available per policy.
4. **Given** an admin searches by buyer email or payment-session reference, **When** results return, **Then** the admin can see the order, the entitlement, and the access status without exposing the buyer's payment credentials.

---

### User Story 5 - Buyers purchase bundles to increase order value (Priority: P2)

Buyers can purchase a bundle that grants access to multiple products at a single combined price, increasing average order value and helping cross-sell the portfolio.

**Why this priority**: Bundles materially raise average order value and are explicit in commercial goals, but a single-product checkout already validates the core thesis. Bundles depend on entitlement, library, and admin systems being in place first.

**Independent Test**: Can be fully tested by purchasing one bundle and verifying that all included products appear as active entitlements in the buyer's library and feed.

**Acceptance Scenarios**:

1. **Given** a published bundle that includes multiple products, **When** a buyer completes checkout, **Then** entitlements are created for every included product and all appear in the library.
2. **Given** a bundle is purchased, **When** the buyer opens any included product's page while signed in, **Then** the product shows as already owned.

---

### User Story 6 - On-site assistant recommends products grounded in the catalog (Priority: P2)

A visitor on the storefront can ask an on-site assistant for product recommendations and receive suggestions limited to active catalog items, with prices, formats, and policy notes pulled from authoritative product data, leading to a hosted-checkout button when they decide to buy.

**Why this priority**: Conversational discovery is a strategic goal and unlocks chat-assisted conversion analytics, but core checkout and library experiences are higher priority. The assistant must never invent prices or claim policies that are not in the catalog.

**Independent Test**: Can be fully tested by asking the assistant a product question, verifying that all returned products are active and that the returned price/format/policy values match the catalog, and confirming that the checkout button initiates a server-validated hosted-checkout session.

**Acceptance Scenarios**:

1. **Given** an active catalog, **When** a visitor asks the assistant for a recommendation, **Then** the assistant returns only active products with price, format, and delivery information sourced from authoritative product data.
2. **Given** the assistant displays a checkout button, **When** the visitor clicks it, **Then** a server-validated hosted-checkout session is created (the assistant never collects payment credentials).
3. **Given** a recommendation is shown or a checkout button is clicked from the assistant, **When** the event occurs, **Then** it is logged for chat-assisted conversion analytics.

---

### User Story 7 - External discovery surfaces consume a structured product feed (Priority: P2)

Search engines, AI answer engines, and future commerce surfaces can consume a public, machine-readable product feed exposing stable product identifiers, canonical URLs, prices, availability, brand, format, seller of record, and category.

**Why this priority**: A valid feed is foundational for AI/search discovery and is a prerequisite for future agentic-commerce protocol onboarding, but the storefront can launch and earn revenue before the feed is published.

**Independent Test**: Can be fully tested by fetching the public feed, validating it against the documented schema, confirming it contains every active product (and only active products) with stable IDs and canonical URLs.

**Acceptance Scenarios**:

1. **Given** the catalog has active products, **When** the public feed is fetched, **Then** it contains all and only active products with stable IDs, canonical URLs, brand, price, currency, availability, format, and seller of record.
2. **Given** a product is archived, **When** the feed is regenerated, **Then** the archived product is no longer present.
3. **Given** the feed is fetched, **When** validated against the documented schema, **Then** validation passes.

---

### User Story 8 - Agent-ready APIs expose merchant capabilities for future protocol clients (Priority: P3)

Programmatic clients (future AI agents and commerce-protocol adapters) can query merchant capabilities, list and inspect products, initiate a checkout that today returns a hosted-payment redirect, query order status, and submit refund requests — without exposing protected files or sensitive customer/payment data.

**Why this priority**: Strategic readiness for agentic commerce. It does not directly drive launch revenue but ensures that future agent-checkout, commerce-discovery, and tokenized payment flows can be added later without rebuilding the catalog, order, or fulfillment subsystems.

**Independent Test**: Can be fully tested by a programmatic client calling the capabilities, products, and checkout endpoints to complete a hosted-checkout purchase via the agent surface, then querying order status and submitting a refund request.

**Acceptance Scenarios**:

1. **Given** the agent capabilities endpoint is queried, **When** the response is returned, **Then** it advertises merchant of record, supported checkout method(s), digital fulfillment, supported currencies, and support actions; tokenized payment is advertised as disabled until eligibility is confirmed.
2. **Given** an agent initiates checkout with a valid product identifier, **When** the request is processed, **Then** the server validates the product and price authoritatively, returns a redirect URL to hosted payment, and never exposes protected file URLs.
3. **Given** an agent queries order status, **When** the response is returned, **Then** it includes status and delivery state but excludes payment credentials and customer-private fields beyond what is necessary.
4. **Given** the platform is configured for a region/account where tokenized payment is not yet eligible, **When** an agent submits a tokenized-payment request, **Then** the request is rejected with a clear capability-disabled response.

---

### User Story 9 - Future commerce-protocol surfaces discover the merchant (Priority: P3)

A discovery endpoint published at a well-known location advertises the merchant, its capabilities, fulfillment model, and pointers to the agent APIs so that future commerce-protocol surfaces can locate and integrate without bespoke onboarding work.

**Why this priority**: A placeholder that costs little to publish, signals readiness, and does not depend on third-party approval. It is sequenced after the agent APIs because it points to them.

**Independent Test**: Can be fully tested by fetching the well-known discovery document and confirming it advertises the merchant, points to the live agent APIs, names the current payment flow, and explicitly does not claim third-party production approval.

**Acceptance Scenarios**:

1. **Given** the discovery endpoint is fetched, **When** parsed, **Then** it identifies merchant of record, capabilities, support contacts, fulfillment type, and current vs. future payment flows.
2. **Given** capability or contact information changes, **When** the discovery document is regenerated, **Then** the change is reflected without code redeploy.

---

### Edge Cases

- A payment-provider webhook is delivered more than once for the same event: fulfillment must be idempotent; no duplicate orders, entitlements, or emails.
- A webhook arrives out of order (e.g., refund event arrives before the completion event): the system must reconcile based on payment-provider state of record, not arrival order.
- A buyer pays but the webhook is delayed: the success page must not promise access that does not yet exist; access is reflected once fulfillment completes.
- A buyer attempts to download with an expired or revoked access token: deny the file and direct the buyer to recover access via their account.
- A protected file URL is shared publicly: the system must not allow permanent or guessable URLs; tokens must be expiring, hashed at rest, and individually revocable, with download counts logged.
- A product price or product itself is changed between the time a buyer (or agent) views it and the time they pay: the server must validate price, currency, and product status authoritatively at session creation; client-supplied prices must be ignored.
- A refund is issued after the buyer has already downloaded: entitlement state must be updated per the published policy, and the policy must be discoverable from the product page and checkout.
- A buyer in a tax-relevant jurisdiction completes checkout: the correct tax treatment must apply for digital goods and the correct seller of record must appear on the receipt.
- A buyer pays with an email different from any existing account: account recovery must still work using the purchase email.
- A product file version has been retired: prior buyers must continue to have access to a working file (current or archived) per policy; new buyers see only current versions.
- The on-site assistant is asked about a product that has been archived or whose price has changed: it must not return stale prices or recommend archived items.
- An agent client requests a payment method that is not enabled in the current region/account: the request must be rejected with a clear "capability disabled" response, not silently fall back.
- A high-volume scraper hits the agent or feed endpoints: rate limiting must protect availability without blocking legitimate discovery.

## Requirements *(mandatory)*

### Functional Requirements

#### Catalog & Product Management

- **FR-001**: System MUST maintain a unified product catalog that supports ebooks, downloadable templates, bundles, and (per Assumption A2) course-style digital products, with stable identifiers and human-readable slugs.
- **FR-002**: Each product MUST carry brand attribution, one or more source-domain attributions, category and tag taxonomy, format(s), price and currency, tax classification, availability status, lifecycle status (draft / active / archived), canonical URL, image, SEO metadata, and discovery (feed / agent) metadata.
- **FR-003**: System MUST support bundles that grant entitlements to all included products upon purchase and that appear as a single purchasable item in catalog, feed, and checkout.
- **FR-004**: Admins MUST be able to create, edit, archive, and publish products and bundles, upload and version protected files, preview product pages, and map products to payment-provider price references — all without code deployment.
- **FR-005**: System MUST validate that every active product has a tax classification and a payment-provider price reference before it can be published.
- **FR-006**: System MUST never accept a client-supplied price; all prices MUST be loaded server-side from the catalog at session creation.

#### Storefront

- **FR-007**: System MUST render storefront pages including a home page, catalog with brand/category filtering, product detail pages, bundle pages, post-payment success page, account/library page, and policy pages (terms, privacy, refund, digital delivery, contact).
- **FR-008**: Each product page MUST display title, subtitle, description, price, currency, format, included files, last-updated date, brand/source, refund policy summary, digital delivery summary, a primary purchase action, and a secure-checkout assurance.
- **FR-009**: Storefront pages MUST be usable on mobile and load promptly enough not to harm conversion (see SC-008).
- **FR-010**: Each product MUST have a stable canonical URL and machine-readable structured metadata appropriate for search and AI discovery.

#### Traffic-Domain Monetization

- **FR-011**: System MUST provide a contextual CTA capability that vertical content domains can render on articles, linking to the matching product or bundle on the central storefront.
- **FR-012**: CTAs MUST preserve source attribution (source domain, article, campaign) such that resulting orders can be attributed to the originating content.
- **FR-013**: At MVP, AnsiblePilot and TerraformPilot MUST be able to render and track these CTAs.

#### Checkout

- **FR-014**: System MUST initiate purchases via a hosted-payment session created by the server after authoritative validation of product, price, currency, availability, and (where applicable) buyer email.
- **FR-015**: Hosted checkout MUST support card payments and the locally relevant non-card methods configured for the seller's region. **MVP set (Stripe Checkout)**: `card`, `ideal`, `bancontact`, `sepa_debit`, `apple_pay`, `google_pay`. Additional methods (e.g., Klarna, P24) MAY be enabled post-launch by Stripe Dashboard configuration only and MUST NOT require code changes.
- **FR-016**: System MUST never receive, store, or transmit raw card credentials; payment credential collection happens entirely at the payment provider.
- **FR-017**: System MUST capture buyer email at checkout and (where required for tax/invoicing) buyer location and VAT/business identifiers.
- **FR-018**: System MUST persist source domain, campaign, and discovery channel on the resulting order.

#### Webhooks & Fulfillment

- **FR-019**: System MUST verify the cryptographic signature of every payment-provider webhook before acting on it.
- **FR-020**: Webhook processing MUST be idempotent; redelivery of the same event MUST NOT create duplicate orders, entitlements, download tokens, or emails.
- **FR-021**: On confirmed payment, the system MUST create or update the customer record, create the order, create entitlement(s) for purchased product(s) and any bundled products, generate secure access for digital files, and send a confirmation email.
- **FR-022**: Failed or canceled payments MUST NOT grant access; expired sessions MUST be cleaned up.
- **FR-023**: Refund events MUST update entitlement status per the published refund policy and notify the buyer.

#### Digital Delivery & Access

- **FR-024**: Protected product files MUST NOT be accessible by permanent or guessable public URLs; access MUST require an unguessable token bound to an entitlement.
- **FR-025**: Access tokens MUST be stored hashed at rest and MUST support per-token revocation. By default, each token MUST expire 24 hours after issuance and MUST be capped at 3 successful downloads. An authenticated buyer MUST be able to regenerate a fresh token at any time from their account library, which makes the regenerated token the durable source of truth for ongoing access.
- **FR-026**: Every download attempt (success, expired, revoked) MUST be logged with sufficient information to support audit and abuse investigation.
- **FR-027**: Buyers MUST be able to recover access using their purchase email without contacting support.
- **FR-028**: Each entitlement MUST be bound to the product file version that was current at the time of purchase (per Assumption A11). When a product file is updated, prior buyers MUST continue to have working access to the version they purchased; the newer version is NOT automatically granted to existing entitlements and is offered to new buyers only. The system MUST record the version pinned to each entitlement and MUST keep prior versions retrievable for the duration of those entitlements.

#### Account / Library

- **FR-029**: Buyers MUST be able to authenticate via passwordless email-based sign-in using the email used at purchase.
- **FR-030**: Authenticated buyers MUST be able to view all of their entitlements, download active files, find receipts/invoices, and submit a support or refund request.

#### Admin

- **FR-031**: Admin access MUST be role-protected and MUST log meaningful administrative actions (publish, refund, file replace, entitlement change) for audit.
- **FR-032**: Admin MUST be able to look up an order by buyer email or by payment-session reference and to inspect, refund, or reissue access for it.

#### On-site Assistant

- **FR-033**: The on-site assistant, when present, MUST recommend only active catalog items and MUST source prices, formats, availability, and policy text from authoritative catalog data — never invented or cached past staleness limits. **MVP scope**: the assistant is a deterministic catalog-search helper (no generative LLM). It surfaces ranked catalog matches based on keyword/category match against `Product` rows. A future LLM-grounded variant MAY replace it post-MVP provided that all recommended fields (price, format, availability, policy) are still loaded server-side from the catalog at render time and never produced by model output.
- **FR-034**: The assistant MUST NOT collect payment credentials; purchase actions MUST go through the standard server-validated hosted-checkout flow.
- **FR-035**: Assistant recommendations and checkout-button clicks MUST be logged as analytics events for chat-assisted conversion measurement.

#### Discovery: Product Feed & Agent APIs

- **FR-036**: System MUST publish a public, machine-readable product feed that includes only active products and bundles, with stable IDs, canonical URLs, brand, price, currency, availability, format, category, and seller of record.
- **FR-037**: System MUST publish a programmatic capabilities document advertising merchant of record, supported checkout method(s), supported currencies, fulfillment type(s), and supported support actions (order status, refund request).
- **FR-038**: System MUST expose programmatic endpoints to list and inspect products (with brand/category filtering), to initiate a checkout that today returns a hosted-payment redirect, to query order status (without exposing payment credentials or unnecessary buyer-private fields), and to submit a refund request.
- **FR-039**: System MUST publish a discovery document at a well-known location that identifies the merchant, points to the agent endpoints, and declares the current vs. future payment flows.
- **FR-040**: System MUST NOT expose protected file URLs through any agent or feed surface.
- **FR-041**: Discovery and agent endpoints MUST be rate-limited.

#### Future Payment Abstraction

- **FR-042**: System MUST implement a payment abstraction so that additional payment flows (notably tokenized agent-payment flows, and provider-direct payment-intent flows) can be added in the future without modifying catalog, order, fulfillment, library, or admin subsystems.
- **FR-043**: Tokenized agent-payment support MUST be feature-flagged per seller account/region and MUST be disabled by default; the capabilities document and agent checkout MUST reflect the current flag state and MUST reject disabled methods with a clear capability response.
- **FR-044**: When tokenized agent-payment is enabled, the system MUST validate token authenticity, seller scope, currency match, amount-within-scope, expiry, and that the cart has not changed since user approval, before charging. **MVP scope (per A9)**: validation logic is NOT implemented at MVP; the SPT provider stub MUST reject all SPT requests with `unsupported_payment_method` while `ENABLE_STRIPE_SPT=false`. Full FR-044 implementation is deferred and gated on the post-MVP enablement decision.

#### Tax, Legal, Policy

- **FR-045**: Each checkout, receipt, and product page MUST clearly identify the seller of record (per Assumption A1).
- **FR-046**: System MUST apply tax for digital goods according to the seller's configured tax rules (including EU VAT/OSS rules where applicable) using buyer location data captured at checkout.
- **FR-047**: System MUST publish, link from product pages, and link from checkout: terms of sale, privacy policy, refund policy, digital delivery policy, and a support contact.
- **FR-048**: Refund policy MUST explicitly state (per Assumption A4): (a) before the buyer first downloads or accesses the file, refunds are granted unconditionally with no time limit; (b) once the buyer begins downloading or accessing the file, the statutory right of withdrawal is waived (with that waiver clearly disclosed and consented to at checkout) and only discretionary goodwill refunds remain. The system MUST track first-access timestamp per entitlement so this distinction is enforceable.

#### Analytics

- **FR-049**: System MUST emit at minimum the following events with source-attribution metadata where applicable: product_page_view, article_cta_view, article_cta_click, chat_recommendation_shown, chat_checkout_clicked, checkout_session_created, checkout_completed, checkout_abandoned, file_downloaded, refund_requested, refund_completed.
- **FR-050**: Admins MUST be able to break down revenue by source domain, by product/bundle, and by campaign.

#### Security & Reliability

- **FR-051**: All buyer-facing and admin traffic MUST be over TLS.
- **FR-052**: Secrets (payment-provider keys, signing secrets, file-storage credentials) MUST be stored in a secrets manager and never in source.
- **FR-053**: Webhook handlers, agent endpoints, and download endpoints MUST be rate-limited and MUST reject malformed or unsigned input.
- **FR-054**: Personal data handling MUST comply with applicable EU/EEA data-protection requirements and the platform's published privacy policy. Default retention (per Assumption A12): orders, invoices, and tax-relevant records retained for 7 years to satisfy Dutch fiscal record-keeping (Art. 52 AWR); customer personal data not required for those records minimized or deleted at the end of that period; analytics events retained for 24 months and then aggregated or deleted. Buyers MUST be able to exercise GDPR rights (access, rectification, erasure where not blocked by fiscal retention) via the support channel.

### Key Entities *(include if feature involves data)*

- **Product**: A purchasable item (ebook, template, course, or bundle component). Carries identity, slug, descriptive content, brand and source-domain attributions, format(s), price and currency, payment-provider price mapping, tax classification, image, canonical URL, lifecycle status, file references with versions, and SEO/discovery metadata.
- **Bundle**: A purchasable item composed of multiple Products. Has its own price and payment-provider price mapping; on purchase issues entitlements for every included Product.
- **Customer**: A buyer identity, keyed by email, with optional country and a payment-provider customer reference. Owns Orders and Entitlements.
- **Order**: A record of a paid (or attempted) purchase. References Customer, items (Products / Bundles with quantities and unit amounts), totals (subtotal / tax / total) and currency, payment-provider reference(s), source-attribution (source domain, campaign), lifecycle status, timestamps.
- **Entitlement**: The granted right of a Customer to access a Product, derived from an Order. Has lifecycle (active / revoked / refunded) and timestamps.
- **DownloadToken**: A short-lived, hashed, individually-revocable, count-limited credential bound to an Entitlement that authorizes one or more file downloads.
- **AnalyticsEvent**: A structured record of a meaningful user, agent, or admin action carrying type, actors/subjects (customer/order/product), source attribution, and metadata.
- **PolicyDocument**: A versioned, publishable legal/policy text (terms, privacy, refund, digital delivery) referenced from product pages and checkout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least one paid purchase is completed end-to-end on the live storefront with the buyer receiving working access automatically and without manual intervention (MVP launch threshold).
- **SC-002**: At least 95% of completed payments result in entitlements created and access emails delivered within 60 seconds of payment confirmation.
- **SC-003**: 100% of payment-provider webhook redeliveries within a 7-day window result in zero duplicate orders, entitlements, or confirmation emails (idempotency target).
- **SC-004**: 0 protected files are accessible via permanent or guessable public URLs; all access requires a valid, unexpired, non-revoked token.
- **SC-005**: Buyers can recover access to a previously purchased product using only their purchase email in under 2 minutes, without contacting support.
- **SC-006**: Within 90 days of launch, at least 5 products or bundles are live and at least 2 vertical traffic domains drive measurable, attributable checkout clicks.
- **SC-007**: Within 90 days of launch, refund rate stays below 10% of completed orders.
- **SC-008**: Product detail pages reach interactive in under 3 seconds on a representative mobile connection at the 75th percentile.
- **SC-009**: A purchase from a vertical-domain article CTA is attributed to the correct source domain and campaign in 100% of cases where attribution metadata reached the storefront.
- **SC-010**: The published product feed validates against its documented schema on every regeneration and contains 100% of active products and 0% of archived products.
- **SC-011**: An admin can publish a brand-new product end-to-end without engineering involvement in under 30 minutes after the first product has been launched.
- **SC-012**: A programmatic client can complete a hosted-checkout purchase via the agent endpoints without any human interaction beyond the buyer's payment-provider step, demonstrated by an automated end-to-end test.
- **SC-013**: Within 90 days of launch, the platform supports at least one bundle product whose average order value is at least 1.8x the average single-product order value.
- **SC-014**: At least 10% of on-site-assistant sessions that surface a product recommendation result in a product-page view or checkout click (engagement threshold).
- **SC-015**: Tokenized agent-payment remains disabled by default at launch and can be enabled per seller account/region by configuration only, with the capabilities document automatically reflecting the change in under 5 minutes.
- **SC-016**: Storefront and checkout-initiation availability (excluding the third-party hosted-payment step itself) MUST meet at least 99.0% monthly uptime (≈ 7.2 hours of allowable downtime per month), measured by external synthetic checks (per Assumption A13).

## Assumptions

- **A1 (Seller of record)**: The seller of record at launch is the Dutch operating entity (Open Empower B.V. / Dutch Operating B.V.). All checkouts, receipts, terms, and product pages reflect this entity. A future U.S. entity is out of scope for MVP and will be added only if a hard commercial trigger is met (confirmed protocol access requiring a U.S. seller, sustained U.S. revenue, U.S. investor or contract requirements).
- **A2 (Course definition for MVP)**: "Courses" in MVP scope refers to file-based packages (PDFs, downloadable code, video files where applicable) delivered via the same entitlement and download system as ebooks. A full LMS (assignments, grading, certificates, progress tracking) is explicitly out of scope. If interactive courseware is later required, it will reuse the same entitlement model.
- **A3 (Currency at launch)**: Launch pricing is denominated in EUR. USD pricing for U.S. buyers may be added later but is not required for MVP and does not block launch.
- **A4 (Refund policy default)**: The published refund policy at launch has two regimes: (i) **Pre-download**: full unconditional refund at any time before the buyer first downloads or accesses any file from the order, with no time limit; (ii) **Post-download**: at the moment the buyer begins downloading or accessing the file, the statutory right of withdrawal for digital content is waived (with that waiver clearly disclosed and explicitly consented to at checkout), and only discretionary goodwill refunds remain admin-decidable. First-access is tracked per entitlement to enforce this distinction.
- **A5 (Payment provider)**: A single third-party payment provider (Stripe) is the chosen vendor for hosted checkout, webhook-based fulfillment, tax, and the eventual tokenized-payment path. Vendor choice is a fixed business decision; the payment abstraction (FR-042) ensures additional providers or methods can be added later without rebuilding catalog/order/fulfillment.
- **A6 (Checkout location)**: At MVP, hosted checkout is initiated only from the central storefront. Vertical content domains link out via CTAs rather than embedding checkout. Embedded vertical-domain checkout may be considered later if conversion data justifies it.
- **A7 (Bundle scope)**: Bundles may span brands/verticals (e.g., a combined Ansible + Terraform + Kubernetes bundle), not only single-brand bundles.
- **A8 (Email domain)**: Transactional purchase email is sent from a domain owned by the operating entity and aligned with the seller of record (e.g., the storefront domain). Anti-spoofing records (SPF/DKIM/DMARC) are configured before launch.
- **A9 (Future protocol readiness)**: Agentic-commerce protocol (ACP), commerce-discovery protocol (UCP), and tokenized agent-payment (Shared Payment Tokens) are explicitly out of MVP production scope; the platform only commits to readiness primitives (feed, capabilities, agent endpoints, well-known discovery, payment abstraction, feature flag).
- **A10 (Marketplace and physical goods)**: Third-party-author marketplace functionality, subscriptions/recurring billing, and physical-goods commerce are out of scope and are not blockers for MVP.
- **A11 (File-update policy — version pinned at purchase)**: Each entitlement is pinned to the product file version that was current at the time of purchase. When a file is updated (corrections, additions, or new editions), prior buyers retain access to their pinned version but do NOT automatically receive the newer version; new versions are sold to new buyers only. Admins MAY at their discretion grant the newer version to specific buyers (e.g., to remedy a defect) but this is not the default. Prior versions MUST remain retrievable for the lifetime of the entitlements that reference them.
- **A12 (Data retention)**: Orders, invoices, and tax-relevant records are retained for 7 years to satisfy Dutch fiscal record-keeping (Art. 52 AWR). Customer personal data not required for those fiscal records is minimized or deleted at the end of that period. Analytics events are retained for 24 months and then aggregated or deleted. GDPR erasure requests are honored except where fiscal retention legally overrides them, in which case the data is restricted from non-fiscal use until the 7-year window elapses.
- **A13 (Availability target)**: At MVP, storefront and checkout-initiation target 99.0% monthly uptime as a best-effort SLO measured by external synthetic checks. The third-party hosted-payment step is excluded from this number and governed by the payment provider's own SLA. Multi-region redundancy and 24/7 on-call are explicitly out of scope at MVP; the target may be revised upward post-launch once revenue justifies it.

## Dependencies

- **D1**: A configured payment-provider account (Stripe) for the operating entity, with tax behavior configured for digital goods, webhook signing secret available, and live-mode credentials provisioned.
- **D2**: Tax classification guidance for each product, reviewed by the operating entity's accountant (EU VAT/OSS posture, U.S. nexus posture if applicable) before live-mode launch.
- **D3**: Published terms of sale, privacy policy, refund policy, and digital delivery policy, reviewed against the seller of record (A1) prior to launch.
- **D4**: Branded transactional email infrastructure (sender domain, authentication records) for delivery confirmations, access links, and refund notifications.
- **D5**: Operational ownership for the four MVP vertical domains (AnsiblePilot, TerraformPilot, Ansible by Example, Kubernetes Recipes) sufficient to embed CTAs on at least AnsiblePilot and TerraformPilot at MVP.
- **D6**: A protected file-storage capability that supports private storage and time-bound, signed access (no public-URL files).
- **D7**: A web analytics and behavior-analytics capability sufficient to satisfy FR-049 / SC-009.
- **D8**: Legal/admin acknowledgment that the U.S. entity decision (and tokenized-payment enablement) is post-MVP and gated on the hard triggers described in A1 / FR-043.

## Out of Scope (MVP)

- Production tokenized agent-payment (e.g., Shared Payment Token) execution.
- Production third-party agentic-commerce checkout inside external AI surfaces.
- Production third-party commerce-discovery checkout inside external AI surfaces.
- Formation of a U.S. legal entity or opening of a U.S. payment-provider account.
- Full learning management system features: assignments, grading, certificates, progress tracking, exams.
- Third-party-author marketplace (multi-seller).
- Physical-goods commerce.
- Recurring billing / subscriptions.
- Merging unrelated business units into this platform.
