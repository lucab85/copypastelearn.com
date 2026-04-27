---
title: "Backstage Developer Portal Guide"
date: "2026-04-21"
description: "Spotify Backstage is the most popular open-source developer portal. Learn how to set it up, create software templates, build a service catalog, and integrate with your existing tools."
category: "DevOps"
tags: ["backstage", "developer-portal", "platform-engineering", "spotify", "service-catalog", "internal-developer-platform"]
---

Backstage is Spotify's open-source developer portal. It provides a single interface for your service catalog, documentation, and infrastructure tooling. It is the most common starting point for teams building an internal developer platform.

## What Backstage Gives You

### Software Catalog

A registry of every service, library, and infrastructure component in your organization:

```yaml
# catalog-info.yaml in your repo root
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: order-service
  description: Handles order processing
  annotations:
    github.com/project-slug: myorg/order-service
    pagerduty.com/service-id: P12345
spec:
  type: service
  lifecycle: production
  owner: team-commerce
  system: ordering
```

Every service declares its owner, dependencies, and metadata. No more "who owns this?" Slack messages.

### Software Templates

Scaffolding for new services that follows your golden path:

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: python-service
  title: Python Microservice
spec:
  owner: platform-team
  type: service
  parameters:
    - title: Service Details
      properties:
        name:
          title: Service Name
          type: string
        owner:
          title: Owner Team
          type: string
          ui:field: OwnerPicker
  steps:
    - id: create-repo
      name: Create Repository
      action: publish:github
    - id: register
      name: Register in Catalog
      action: catalog:register
```

Developers fill out a form. Backstage creates the repo, CI pipeline, Kubernetes namespace, and monitoring — all from a template.

### TechDocs

Documentation that lives with the code and renders in the portal:

```
docs/
  index.md
  architecture.md
  runbook.md
mkdocs.yml
```

TechDocs uses MkDocs under the hood. Documentation is version-controlled, reviewed in PRs, and automatically published.

### Plugin Ecosystem

Backstage has 100+ community plugins:

- **Kubernetes** — view pod status per service
- **CI/CD** — GitHub Actions, Jenkins, ArgoCD status
- **PagerDuty** — on-call schedules and incidents
- **Cost** — cloud spend per service
- **API docs** — OpenAPI/GraphQL schema browser

## Getting Started

```bash
# Create a new Backstage app
npx @backstage/create-app@latest

# Start the development server
cd my-backstage-app
yarn dev
```

The default installation gives you a working catalog and template system. From there, add plugins and customize.

## Common Mistakes

### Starting Too Big

Do not try to integrate everything on day one. Start with the software catalog. Get every team to register their services. That alone provides value — you now have a single source of truth for service ownership.

### Ignoring Adoption

Backstage is only useful if developers actually use it. The portal needs to be the fastest way to find information. If it is slower than searching Slack, people will search Slack.

### No Dedicated Team

Backstage requires ongoing maintenance. Plugins need updates, templates need iteration, and the catalog needs curation. Treat it as a product with a team, not a side project.

## Who Should Use Backstage

If you have fewer than 10 services and 20 engineers, a shared wiki and good README files are probably sufficient. Backstage adds value when the number of services exceeds what any one person can keep in their head.

---

Ready to go deeper? Build platform engineering skills with hands-on courses at [CopyPasteLearn](/courses).
