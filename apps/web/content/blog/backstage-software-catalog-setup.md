---
title: "Backstage Software Catalog Setup"
date: "2026-03-05"
description: "Backstage's software catalog gives you a single inventory of all services, APIs, and infrastructure. Learn how to register components, define system models, and build a searchable developer portal."
category: "DevOps"
tags: ["backstage", "software-catalog", "developer-portal", "platform-engineering", "microservices", "documentation"]
---

When your organization hits 50+ microservices, nobody knows what exists. "Who owns the payment service?" becomes a Slack thread. "What API does the inventory service expose?" requires reading source code. Backstage's software catalog solves this.

## What the Catalog Contains

Every entity in your organization, described in YAML:

```yaml
# catalog-info.yaml (in your repo root)
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-api
  description: Handles order creation, updates, and fulfillment
  annotations:
    github.com/project-slug: myorg/order-api
    backstage.io/techdocs-ref: dir:.
  tags:
    - python
    - grpc
  links:
    - url: https://grafana.internal/d/order-api
      title: Grafana Dashboard
    - url: https://runbooks.internal/order-api
      title: Runbook
spec:
  type: service
  lifecycle: production
  owner: team-commerce
  system: ordering
  providesApis:
    - order-api
  consumesApis:
    - payment-api
    - inventory-api
  dependsOn:
    - resource:orders-database
```

One file per service. Commit it alongside your code. Backstage indexes it.

## Entity Types

| Kind | Purpose | Example |
|------|---------|---------|
| Component | A software component | order-api, frontend-app |
| API | An API definition | order-api (OpenAPI spec) |
| Resource | Infrastructure | orders-database, redis-cache |
| System | Group of components | ordering-system |
| Domain | Business domain | commerce, payments |
| Group | Team or org unit | team-commerce |
| User | Individual | jane.doe |

## System Model

```yaml
# Domain
apiVersion: backstage.io/v1alpha1
kind: Domain
metadata:
  name: commerce
spec:
  owner: group:commerce-division

---
# System
apiVersion: backstage.io/v1alpha1
kind: System
metadata:
  name: ordering
spec:
  owner: team-commerce
  domain: commerce

---
# Components belong to the system
# (defined in each repo's catalog-info.yaml)
```

This creates a hierarchy: Domain → System → Components. Navigate from business concepts to individual services.

## API Definitions

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: order-api
  description: Order management API
spec:
  type: openapi
  lifecycle: production
  owner: team-commerce
  system: ordering
  definition:
    $text: ./openapi.yaml
```

Backstage renders the OpenAPI spec as interactive documentation. Developers find APIs without asking on Slack.

## Registration

### Static Locations

```yaml
# app-config.yaml
catalog:
  locations:
    - type: url
      target: https://github.com/myorg/order-api/blob/main/catalog-info.yaml
    - type: url
      target: https://github.com/myorg/payment-api/blob/main/catalog-info.yaml
```

### GitHub Discovery

Auto-discover all repos with `catalog-info.yaml`:

```yaml
catalog:
  providers:
    github:
      myorg:
        organization: myorg
        catalogPath: /catalog-info.yaml
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
```

Every repo in your GitHub org that has a `catalog-info.yaml` is automatically registered.

## What You Can Search

Once the catalog is populated:

- "Show me all services owned by team-commerce"
- "What APIs does the ordering system expose?"
- "Which services depend on the orders database?"
- "What services are in the payments domain?"
- "Show me all production services using Python"

Filter by owner, lifecycle, type, tag, or system. Every question answered in seconds instead of Slack threads.

## TechDocs

Backstage renders Markdown documentation alongside catalog entries:

```yaml
# In catalog-info.yaml
metadata:
  annotations:
    backstage.io/techdocs-ref: dir:.
```

```
repo/
├── catalog-info.yaml
├── mkdocs.yml
└── docs/
    ├── index.md
    ├── architecture.md
    └── runbook.md
```

Documentation lives with code, rendered in the developer portal. No separate wiki to maintain.

## Scorecards

Track engineering standards across all services:

```yaml
# Check: Does every service have a Dockerfile?
# Check: Is the service using the latest base image?
# Check: Does it have a runbook?
# Check: Is test coverage above 80%?
```

Scorecards surface which services meet standards and which need attention — across your entire organization.

## Getting Started

```bash
npx @backstage/create-app@latest
cd my-backstage-app
yarn dev
```

Start with 5-10 key services. Add `catalog-info.yaml` to each repo. Once teams see the value, adoption spreads organically.

---

Ready to go deeper? Build your developer platform with hands-on courses at [CopyPasteLearn](/courses).
