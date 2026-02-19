<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial ratification)
  Modified principles: N/A (all new)
  Added sections:
    - Core Principles (5 principles)
    - Security Requirements
    - Architecture & Technology Stack
    - Quality & Testing Standards
    - Decision Rules & Definition of Done
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md         ✅ compatible (generic Constitution Check gate)
    - .specify/templates/spec-template.md          ✅ compatible (no constitution-specific refs)
    - .specify/templates/tasks-template.md         ✅ compatible (generic task phases)
    - .specify/templates/checklist-template.md     ✅ compatible (generic structure)
    - .specify/templates/agent-file-template.md    ✅ compatible (generic structure)
  Follow-up TODOs: none
-->

# CopyPasteLearn Constitution

Video Courses + Interactive Virtual Labs (MVP)

## Mission

Build a smooth, modern e-learning platform where users feel
comfortable learning by watching video lessons and practicing
real IT automation in secure, ephemeral labs with immediate
validation and feedback.

## Core Principles

### I. Comfort-First Learning UX

Every interface MUST prioritize calm, focused learning over
feature density. This is the primary differentiator.

- One primary action per screen (Start, Continue, Validate).
- Clear system status at all times (Provisioning → Ready →
  Running → Validating → Done).
- Calm layouts with generous whitespace, minimal clutter, and
  consistent spacing using shadcn/ui component library.
- Friendly microcopy that reduces anxiety and encourages retry.
- Skeleton loading states MUST be used; layout shifts MUST be
  avoided; Largest Contentful Paint MUST be kept low.
- Fast perceived performance: marketing pages MUST use minimal
  hydration; interactive pages MUST feel responsive.
- Readable typography and consistent visual hierarchy throughout.

**Rationale**: Users learning IT automation are often beginners
facing intimidating tooling. A comfort-first UX lowers the
barrier to engagement and retention.

### II. Trust & Safety (NON-NEGOTIABLE)

User automation code executes in secure, ephemeral sandboxes.
Security failures are ship-blockers — no exceptions.

- Default deny: sandbox network egress MUST be blocked unless
  explicitly allowed per lab definition.
- No privileged containers, no host mounts, non-root execution
  wherever possible.
- Strict CPU/memory quotas per session; max concurrent labs per
  user MUST be enforced.
- Hard TTL enforcement + janitor cleanup to prevent resource
  leaks and cost spikes.
- Outputs shown to users MUST be sanitized — no secrets, no
  internal endpoints, no stack traces from infrastructure.
- All lab actions MUST be authenticated and authorized.
- Audit logs MUST be maintained for lab session lifecycle and
  execution actions.
- Least privilege: every service account and runtime identity
  MUST have the minimum permissions required.

**Rationale**: Users run arbitrary code. A single sandbox escape
or resource leak can compromise the platform, other users, or
costs. Security is non-negotiable.

### III. Ship Fast with Ready Solutions

Prefer proven managed services over custom builds. Building
from scratch requires explicit justification.

- Use Clerk for auth, Clerk Billing + Stripe for subscriptions,
  Mux for video delivery, Vercel for hosting, and managed
  Postgres for persistence.
- If a ready-made solution exists and meets requirements, it
  MUST be used unless documented reasons prevent adoption.
- Custom implementations are permitted only when no managed
  service meets security, determinism, or integration needs.
- MVP scope MUST be respected: no native mobile apps, no
  B2B/team accounts, no advanced quizzes/certificates, no
  complex billing unless explicitly required.

**Rationale**: Time-to-market matters. Every custom component is
a maintenance liability. Managed services trade cost for velocity
and operational simplicity.

### IV. Deterministic Labs

Lab validations MUST produce the same result given the same
user actions. Flaky checks are bugs, not edge cases.

- Validations MUST be reproducible and explainable — the user
  MUST understand why a check passed or failed.
- Prefer pre-baked lab images over runtime installs to eliminate
  transient dependency failures.
- Lab definitions MUST be versioned; compiled plan artifacts
  MUST be stored.
- Published lab versions MUST maintain backward compatibility.
- No "silent failures": the user MUST see a friendly error
  message and a clear recovery path.

**Rationale**: Non-deterministic validation destroys learner
trust. If a user does the right thing and the check fails, they
lose confidence in the platform.

### V. Clean Integration Boundaries

The web platform treats labs as an external "Lab Service API."
Domain boundaries MUST be explicit and respected.

- The web app MUST NOT directly orchestrate containers or lab
  infrastructure; all lab interaction goes through the Lab
  Service API.
- Use event streaming (SSE/WebSocket) for real-time lab state
  updates; no polling.
- Code MUST be modular with separate domains: auth, billing,
  courses, labs.
- Server actions and route handlers MUST be used for secure
  server-side operations.
- Clerk is the source of truth for identity; `clerkUserId` is
  the user key across all services.
- Postgres + Prisma for data persistence (courses, lessons,
  progress, lab sessions).

**Rationale**: Clean boundaries allow the lab runtime to evolve
(different orchestrators, different languages) without rewriting
the web application. They also enforce security by preventing
the web tier from gaining direct infrastructure access.

## Security Requirements

These requirements MUST be verified before any feature ships.
A security failure blocks release.

- **Sandbox isolation**: Each lab session runs in an isolated
  environment with no access to other sessions or host
  resources.
- **Network policy**: Egress is default-deny. Allowed
  destinations MUST be declared in the lab definition.
- **Resource limits**: CPU, memory, and storage quotas MUST be
  configured per session and enforced by the runtime.
- **Concurrency cap**: Maximum concurrent lab sessions per user
  MUST be enforced server-side.
- **TTL + janitor**: Every lab session MUST have a hard TTL.
  A cleanup janitor process MUST run to reclaim sessions that
  exceed TTL or are orphaned.
- **Output sanitization**: All terminal output, logs, and
  validation results displayed to users MUST be sanitized.
- **Auth + authz**: Every API endpoint and lab action MUST
  require authentication; authorization MUST be checked per
  resource.
- **Audit trail**: Lab session creation, execution events,
  validation results, and teardown MUST be logged with
  correlation IDs (`session_id`, `lab_session_id`).
- **No privileged execution**: Containers MUST NOT run as
  privileged; host mounts MUST NOT be used; non-root execution
  is the default.

## Architecture & Technology Stack

- **Framework**: Next.js App Router + TypeScript.
- **Database**: Postgres + Prisma ORM.
- **Auth**: Clerk (source of truth for identity).
- **Billing**: Clerk Billing + Stripe. Start with one plan
  (e.g., €9/mo); defer complex billing until needed.
- **Video**: Mux with playback IDs.
- **Hosting**: Vercel (managed deployment).
- **Lab runtime**: Accessed exclusively via Lab Service API.
- **Real-time updates**: SSE or WebSocket for lab state.
- **Marketing pages**: Lightweight, minimal hydration;
  server-rendered wherever feasible.
- **Logging**: Structured logs with correlation IDs across all
  services. Every important operation MUST be logged.
- **Domain separation**: auth, billing, courses, labs MUST be
  distinct modules with clear public interfaces.

## Quality & Testing Standards

### Quality Bar

- Correctness and safety MUST take priority over new features.
- No "silent failures": every error MUST surface a friendly
  message with a recovery path.
- Backward compatibility MUST be maintained for published lab
  versions and course content.

### Testing Requirements

- **Unit tests**: YAML schema validation/compilation and access
  control logic MUST have unit tests.
- **Integration tests**: The full lab lifecycle MUST be covered:
  create session → provision → run → validate → teardown.
- **Determinism**: All lab validations MUST be tested for
  reproducibility.

### Observability Requirements

- **Metrics**: Provisioning time, teardown leak rate, validation
  duration, and failure rate MUST be tracked.
- **Alerts**: Leaked sandboxes, high validation failure rate,
  and cost spikes MUST trigger alerts.
- **Correlation IDs**: Every request and lab action MUST carry
  `session_id` and `lab_session_id` for traceability.

## Decision Rules & Definition of Done

### Decision Rules

1. If a ready-made solution exists and meets requirements,
   use it — do not build custom.
2. If adding a feature risks security or determinism, it MUST
   be deferred until it can be delivered safely.
3. If a feature adds complexity without clear user value,
   do not build it.
4. Every new system MUST have a rollback path.

### Definition of Done

A feature is complete when ALL of the following are true:

- [ ] Meets security requirements (Section: Security
  Requirements).
- [ ] Has clear UX states and error handling for every user-
  facing flow.
- [ ] Is observable: structured logs and key metrics are in
  place.
- [ ] Has tests appropriate to the risk level of the change.
- [ ] Documentation updated: README and runbook for any
  ops-sensitive parts.

## Governance

This constitution is the highest-authority document for the
CopyPasteLearn project. All implementation decisions, code
reviews, and architecture choices MUST comply with these
principles.

### Amendment Procedure

1. Propose the change with rationale in a pull request
   modifying this file.
2. The change MUST document which principles are affected
   and why.
3. If a principle is removed or redefined (backward
   incompatible), the version MUST receive a MAJOR bump.
4. New principles or materially expanded guidance receive
   a MINOR bump.
5. Clarifications, wording fixes, and non-semantic
   refinements receive a PATCH bump.

### Compliance Review

- All PRs and code reviews MUST verify compliance with
  this constitution.
- Complexity deviations MUST be justified in the PR
  description with reference to the specific principle
  being relaxed.
- The plan-template.md "Constitution Check" gate MUST be
  satisfied before Phase 0 research and re-checked after
  Phase 1 design.

### Versioning Policy

Follows semantic versioning:
- **MAJOR**: Backward-incompatible governance/principle
  removals or redefinitions.
- **MINOR**: New principle/section added or materially
  expanded guidance.
- **PATCH**: Clarifications, wording, typo fixes,
  non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-02-19 | **Last Amended**: 2026-02-19
