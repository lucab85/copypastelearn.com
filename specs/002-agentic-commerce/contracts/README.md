# Contracts: Agentic Commerce

This directory specifies the externally-visible HTTP contracts for the feature. Each route is documented in a markdown file alongside JSON Schemas under `schemas/` that contract tests assert against in CI.

| File | Routes |
|---|---|
| [public-storefront-api.md](public-storefront-api.md) | `GET /api/products`, `GET /api/products/{id}`, `POST /api/checkout/stripe`, `GET /api/orders/{id}`, `GET /api/download/{token}` |
| [agent-api.md](agent-api.md) | `GET /api/agent/capabilities`, `GET /api/agent/products`, `GET /api/agent/products/{id}`, `POST /api/agent/checkout`, `GET /api/agent/orders/{id}`, `POST /api/agent/refund-request`, `GET /.well-known/ucp` |
| [product-feed.md](product-feed.md) | `GET /feeds/products.json` |
| [webhooks.md](webhooks.md) | `POST /api/webhooks/stripe` (event-type matrix) |

## Conventions

- All request/response bodies are JSON (`Content-Type: application/json`); webhooks send raw bytes — see [webhooks.md](webhooks.md).
- Money is always represented as `{ "amount": "<decimal-string>", "currency": "<ISO-4217>" }` in agent and feed responses (e.g. `{"amount":"29.00","currency":"EUR"}`); internally money is stored as integer minor units. Internal storefront APIs MAY use minor-unit integers — schemas document which.
- Errors use `error.schema.json`: `{ "error": { "code": "<machine_code>", "message": "<human_text>", "details": [...] } }` with appropriate HTTP status.
- Rate-limit responses use `429 Too Many Requests` with `Retry-After` header.
- All public surfaces enforce HTTPS in production.
