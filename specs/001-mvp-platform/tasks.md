# Tasks: CopyPasteLearn MVP Platform

**Input**: Design documents from `/specs/001-mvp-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted. Testing infrastructure (Vitest, Playwright, axe-core) is included in setup for future use.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/` (Next.js App Router)
- **Lab Service**: `services/labs/` (Fastify + Dockerode)
- **Shared package**: `packages/shared/` (types, schemas, constants)
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Monorepo initialization, project scaffolding, and toolchain configuration

- [x] T001 Create monorepo root configuration (pnpm-workspace.yaml, turbo.json, .nvmrc, tsconfig.base.json, root package.json with workspace scripts)
- [x] T002 Initialize Next.js app with TypeScript strict mode, Tailwind CSS 3, and shadcn/ui in apps/web/ (package.json, next.config.ts, tailwind.config.ts, tsconfig.json, postcss.config.js)
- [x] T003 [P] Initialize Fastify project with TypeScript in services/labs/ (package.json, tsconfig.json, src/index.ts entry point)
- [x] T004 [P] Initialize shared TypeScript library with build config in packages/shared/ (package.json, tsconfig.json, src/index.ts barrel export)
- [x] T005 [P] Create environment variable example files in apps/web/.env.example and services/labs/.env.example per quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, authentication, shared types, webhook handlers, and Lab Service base — MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Write full Prisma schema (User, Course, Lesson, LabDefinition, LabSession, LabAttempt, CourseProgress, LessonProgress, Subscription models + Role, Difficulty, ContentStatus, LabSessionStatus, SubscriptionStatus enums) in apps/web/prisma/schema.prisma per data-model.md
- [x] T007 Generate Prisma client and create initial migration in apps/web/ (pnpm prisma generate && pnpm prisma migrate dev --name init)
- [x] T008 [P] Create Prisma client singleton with connection pooling in apps/web/src/lib/db.ts
- [x] T009 [P] Implement root layout with ClerkProvider, Tailwind globals, and base metadata in apps/web/src/app/layout.tsx
- [x] T010 [P] Create Clerk route-protection middleware (public: /, /courses, /pricing, /sign-in, /sign-up, /api/webhooks; protected: /dashboard, /lessons, /labs, /settings; admin: /admin) in apps/web/middleware.ts
- [x] T011 [P] Create auth helper functions (getCurrentUser, requireAuth, requireAdmin) in apps/web/src/lib/auth.ts
- [x] T012 [P] Create shared TypeScript types for lab sessions, courses, lessons, and API payloads in packages/shared/src/types/lab.ts, packages/shared/src/types/course.ts, and packages/shared/src/types/api.ts
- [x] T013 [P] Create shared Zod schemas for API request/response validation in packages/shared/src/schemas/api.ts and shared constants (TTL defaults, session limits, status enums) in packages/shared/src/constants.ts
- [x] T014 Implement Lab Service base: Fastify server setup, environment config loader, Pino structured logger with correlation IDs, API-key auth middleware, health endpoint (GET /health), and route registration in services/labs/src/
- [x] T015 [P] Create Clerk webhook route handler for user sync (user.created, user.updated, user.deleted events with svix signature validation) in apps/web/src/app/api/webhooks/clerk/route.ts
- [x] T016 [P] Create Stripe webhook route handler for subscription sync (checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed events) in apps/web/src/app/api/webhooks/stripe/route.ts
- [x] T017 [P] Install and configure foundational shadcn/ui components (Button, Card, Badge, Skeleton, Input, Tabs, Dialog, DropdownMenu, Separator) in apps/web/src/components/ui/

**Checkpoint**: Foundation ready — database, auth, shared types, webhooks, and Lab Service base operational. User story implementation can begin.

---

## Phase 3: User Story 1 — Browse & Watch Video Lessons (Priority: P1) 🎯 MVP

**Goal**: Visitors browse the course catalog, view course details, sign up, watch video lessons with transcript/snippets/resources, and resume from saved position. Lesson completion is tracked.

**Independent Test**: A new visitor discovers a published course, reads its details, signs up, watches a lesson start to finish, closes the browser, returns later, and resumes at the saved position. Progress shows the lesson as completed after the video ends.

### Implementation for User Story 1

- [x] T018 [P] [US1] Create getCourses query (published courses with lesson count and optional user progress) and getCourse query (full course with ordered lessons) in apps/web/src/server/queries/courses.ts
- [x] T019 [P] [US1] Create getLesson query (lesson content with video, transcript, snippets, resources, lab definition ID, next/prev navigation) in apps/web/src/server/queries/lessons.ts
- [x] T020 [P] [US1] Create CourseCard component (title, description, difficulty badge, lesson count, thumbnail, progress indicator) in apps/web/src/components/course/course-card.tsx
- [x] T021 [US1] Create course catalog page (grid of CourseCard components, server-rendered) in apps/web/src/app/(marketing)/courses/page.tsx
- [x] T022 [US1] Create course detail page (outcomes, prerequisites, difficulty, duration, ordered lesson list with durations) in apps/web/src/app/(marketing)/courses/[slug]/page.tsx
- [x] T023 [P] [US1] Create VideoPlayer component with @mux/mux-player-react (startTime for resume, onTimeUpdate for position tracking, onEnded for completion) in apps/web/src/components/lesson/video-player.tsx
- [x] T024 [P] [US1] Create TranscriptPanel component (collapsible, synced with video if possible) in apps/web/src/components/lesson/transcript-panel.tsx
- [x] T025 [P] [US1] Create CodeSnippet component (syntax-highlighted, one-click clipboard copy with visual confirmation) in apps/web/src/components/lesson/code-snippet.tsx
- [x] T026 [P] [US1] Create ResourceList component (downloadable resources and links) in apps/web/src/components/lesson/resource-list.tsx
- [x] T027 [US1] Create lesson player page (VideoPlayer + TranscriptPanel + CodeSnippet + ResourceList + next/prev lesson nav) in apps/web/src/app/(app)/courses/[slug]/lessons/[lessonSlug]/page.tsx
- [x] T028 [US1] Implement saveVideoPosition server action (debounced upsert to LessonProgress) in apps/web/src/server/actions/progress.ts
- [x] T029 [US1] Implement markLessonComplete server action (set completed=true on LessonProgress, recalculate parent CourseProgress.percentComplete) in apps/web/src/server/actions/progress.ts
- [x] T030 [P] [US1] Create Clerk sign-in page in apps/web/src/app/(marketing)/sign-in/[[...sign-in]]/page.tsx and sign-up page in apps/web/src/app/(marketing)/sign-up/[[...sign-up]]/page.tsx
- [x] T031 [US1] Create homepage/landing page (hero, value proposition, featured courses, CTA) in apps/web/src/app/(marketing)/page.tsx

**Checkpoint**: User Story 1 complete — visitors can browse courses, sign up, watch video lessons, resume from saved position, and track completion. This is the MVP increment.

---

## Phase 4: User Story 2 — Launch & Complete Interactive Lab (Priority: P2)

**Goal**: Subscribed learners launch ephemeral lab environments from lesson pages, interact via a browser terminal, run validations with structured feedback, and complete labs. Sessions auto-expire and clean up.

**Independent Test**: A subscribed learner navigates to a lesson with a lab, clicks "Start Lab," sees provisioning → ready, reads step instructions, executes commands in the terminal, clicks "Validate," receives pass/fail feedback with hints, retries on failure, completes the lab. Session cleans up after completion or TTL expiry.

### Lab Service Backend (services/labs/)

- [x] T032 [P] [US2] Define orchestrator ContainerProvider interface (create, exec, attach, stop, remove, healthCheck) in services/labs/src/orchestrator/interface.ts
- [x] T033 [P] [US2] Define compiled execution plan types in services/labs/src/compiler/types.ts and validation result types in services/labs/src/validator/types.ts
- [x] T034 [US2] Implement Docker orchestrator provider via Dockerode (container create with resource limits, network isolation, non-root user; exec with timeout; stop and remove) in services/labs/src/orchestrator/docker.ts
- [x] T035 [P] [US2] Implement lab definition Zod schema for YAML validation (steps, checks, environment config) in services/labs/src/compiler/schema.ts
- [x] T036 [P] [US2] Implement YAML-to-execution-plan compiler (parse YAML, validate against schema, emit compiled plan) in services/labs/src/compiler/parser.ts
- [x] T037 [P] [US2] Implement output sanitizer (strip internal IPs, Docker paths, secrets; truncate at 64KB) in services/labs/src/validator/sanitizer.ts
- [x] T038 [US2] Implement session handlers (POST /sessions — create with concurrent-session check; GET /sessions/:id — status; DELETE /sessions/:id — destroy) in services/labs/src/api/sessions.ts
- [x] T039 [US2] Implement SSE event stream endpoint (GET /sessions/:id/events — status, step, validation, heartbeat, error events per contract) in services/labs/src/api/events.ts
- [x] T040 [US2] Implement WebSocket terminal streaming endpoint (WS /sessions/:id/terminal — bidirectional input/output/resize/exit with sanitization) in services/labs/src/api/terminal.ts
- [x] T041 [US2] Implement validation runner (exec check commands inside sandbox, collect structured results with pass/fail/hint per check) in services/labs/src/validator/runner.ts
- [x] T042 [US2] Implement validation API endpoint (POST /sessions/:id/validate — run checks, advance step on pass, return structured feedback) in services/labs/src/api/validate.ts
- [x] T043 [US2] Implement janitor cleanup process (periodic scan for sessions past expiresAt, destroy containers, update status to EXPIRED/DESTROYED) in services/labs/src/orchestrator/cleanup.ts

### Web App Lab Integration (apps/web/)

- [x] T044 [US2] Create typed Lab Service API client (createSession, getSession, destroySession, validateStep, SSE/WebSocket URL builders) in apps/web/src/lib/lab-client.ts
- [x] T045 [US2] Implement lab server actions (createLabSession — proxy to Lab Service with userId and labDefinitionId; destroyLabSession; validateLabStep) in apps/web/src/server/actions/labs.ts
- [x] T046 [P] [US2] Create LabStatusIndicator component (animated status transitions: Provisioning → Ready → Running → Validating → Completed/Expired) in apps/web/src/components/lab/lab-status.tsx
- [x] T047 [P] [US2] Create ValidationFeedback component (per-check pass/fail list with hint messages, retry button) in apps/web/src/components/lab/validation-feedback.tsx
- [x] T048 [US2] Create TerminalView component (xterm.js + xterm-addon-fit + WebSocket connection to Lab Service terminal endpoint) in apps/web/src/components/lab/terminal-view.tsx
- [x] T049 [US2] Create LabPanel component (split-view: step instructions panel + TerminalView + ValidationFeedback + LabStatusIndicator, "Validate" button) in apps/web/src/components/lab/lab-panel.tsx
- [x] T050 [US2] Create full-screen lab session page in apps/web/src/app/(app)/labs/[sessionId]/page.tsx
- [x] T051 [US2] Integrate lab launch ("Start Lab" button, LabPanel embed, SSE status stream) into lesson player page in apps/web/src/app/(app)/courses/[slug]/lessons/[lessonSlug]/page.tsx

**Checkpoint**: User Story 2 complete — learners can launch labs, interact via terminal, validate steps, and get structured feedback. Expired sessions auto-clean.

---

## Phase 5: User Story 3 — Subscribe to Access Premium Content (Priority: P3)

**Goal**: Non-subscribers see a paywall on premium lessons/labs. A pricing page presents the single plan (€29/month). After subscribing via Clerk Billing + Stripe, the learner gains immediate access. Subscribers can cancel from settings.

**Independent Test**: A non-subscribed learner attempts to access a premium lesson (not the first lesson), sees a paywall, subscribes, immediately gains access. They then cancel from settings and retain access until the billing period ends.

### Implementation for User Story 3

- [x] T052 [P] [US3] Create billing helper (getSubscriptionStatus — check local Subscription table, fallback to Clerk SDK; isSubscribed boolean) in apps/web/src/lib/billing.ts
- [x] T053 [P] [US3] Create Paywall component (upgrade prompt with value proposition and link to pricing) in apps/web/src/components/course/paywall.tsx
- [x] T054 [US3] Create pricing page (single plan card: €29/month, benefits list, Clerk Billing subscribe action) in apps/web/src/app/(marketing)/pricing/page.tsx
- [x] T055 [US3] Add subscription gating to getLesson query (first lesson free via sortOrder === 0; all others require active subscription; return 403 via Paywall for non-subscribers) in apps/web/src/server/queries/lessons.ts
- [x] T056 [US3] Create account settings page (subscription status display, cancel action via Clerk Billing portal, account details) in apps/web/src/app/(app)/settings/page.tsx
- [x] T057 [US3] Add isFree and isAccessible flags to course detail lesson list and show lock icons on gated lessons in apps/web/src/app/(marketing)/courses/[slug]/page.tsx

**Checkpoint**: User Story 3 complete — subscription gating, pricing page, and settings page with cancel functionality. First lesson of each course remains free.

---

## Phase 6: User Story 4 — Learning Dashboard & Progress Overview (Priority: P4)

**Goal**: Returning learners see their personal dashboard with in-progress courses, "Continue where you left off" prompt, completed courses, and active lab session status.

**Independent Test**: A learner who started two courses and completed several lessons logs in, sees the dashboard with accurate per-course progress, clicks "Continue" on a partially watched lesson, and lands at the saved video position.

### Implementation for User Story 4

- [x] T058 [P] [US4] Create getDashboard server query (in-progress courses with percentComplete, recent lessons sorted by lastAccessedAt, active lab session if any) in apps/web/src/server/queries/dashboard.ts
- [x] T059 [P] [US4] Create ProgressCard component (course title, progress bar, next lesson suggestion) in apps/web/src/components/dashboard/progress-card.tsx
- [x] T060 [P] [US4] Create ContinuePrompt component (prominent card with lesson title, course name, "Resume" action) in apps/web/src/components/dashboard/continue-prompt.tsx
- [x] T061 [P] [US4] Create ActiveLabCard component (lab title, status badge, remaining time, "Resume Lab" action) in apps/web/src/components/dashboard/active-lab-card.tsx
- [x] T062 [US4] Create dashboard page (ContinuePrompt + in-progress ProgressCards + active lab + completed courses section) in apps/web/src/app/(app)/dashboard/page.tsx

**Checkpoint**: User Story 4 complete — learners have a calm, motivating dashboard that shows their progress and makes resuming effortless.

---

## Phase 7: User Story 5 — Content Authoring & Publishing (Priority: P5)

**Goal**: Admin users create courses, add lessons with Mux video references, attach YAML lab definitions, and publish courses to the catalog. Drafts are saved independently of published content.

**Independent Test**: An admin creates a course with a title and description, adds two lessons (one with a video, one with a video and a lab definition), saves as draft, previews, publishes. Learners can then discover the newly published course in the catalog.

### Implementation for User Story 5

- [x] T063 [US5] Create admin layout with Clerk ADMIN role guard (redirect non-admins) in apps/web/src/app/admin/layout.tsx
- [x] T064 [US5] Create admin course list page (all courses with draft/published status, create new button) in apps/web/src/app/admin/courses/page.tsx
- [x] T065 [US5] Create admin course create/edit page (form for title, description, outcomes, prerequisites, difficulty; save as draft) in apps/web/src/app/admin/courses/new/page.tsx and apps/web/src/app/admin/courses/[id]/page.tsx
- [x] T066 [US5] Create admin lesson create/edit page (form for title, description, Mux playback ID, transcript, code snippets, resources, sort order) in apps/web/src/app/admin/courses/[id]/lessons/new/page.tsx and apps/web/src/app/admin/courses/[id]/lessons/[lessonId]/page.tsx
- [x] T067 [US5] Implement admin server actions (createCourse, updateCourse, publishCourse, unpublishCourse, createLesson, updateLesson, reorderLessons) in apps/web/src/server/actions/admin.ts
- [x] T068 [US5] Create lab definition YAML editor with Zod schema validation and preview in apps/web/src/app/admin/courses/[id]/lessons/[lessonId]/page.tsx
- [x] T069 [US5] Create admin lab sessions monitor page (active sessions list with status, user, expiry, destroy action) in apps/web/src/app/admin/labs/page.tsx

**Checkpoint**: User Story 5 complete — admins can author, manage, and publish content. Lab definitions are validated against the schema before save.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility compliance, performance optimization, observability, and seed data

- [x] T070 [P] Run axe-core accessibility audit on all learner-facing pages (catalog, course detail, lesson, lab, dashboard, pricing, settings) and fix WCAG 2.1 Level A violations
- [x] T071 [P] Configure ISR caching (revalidate: 3600) for course catalog and course detail pages with on-demand revalidation after admin publish in apps/web/src/app/(marketing)/courses/
- [x] T072 [P] Add Pino structured logging with correlation IDs (user_id, session_id, lab_session_id) to all server actions in apps/web/src/server/
- [x] T073 Create database seed script (2 sample courses, 5 lessons each, 2 lab definitions with YAML) in apps/web/prisma/seed.ts
- [x] T074 Validate quickstart.md end-to-end (clone, install, migrate, seed, start both servers, verify all setup checks pass)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion; integrates with US1 lesson page (T051)
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion; modifies US1 lesson queries (T055)
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) completion; reads data from US1 + US2
- **User Story 5 (Phase 7)**: Depends on Foundational (Phase 2) completion; independent of other stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Can start after Phase 2 — Lab Service backend (T032–T043) is fully independent; web integration (T051) touches the US1 lesson page
- **US3 (P3)**: Can start after Phase 2 — pricing page is independent; gating (T055) modifies US1 lesson query
- **US4 (P4)**: Can start after Phase 2 — reads progress data; most valuable after US1 + US2 are complete
- **US5 (P5)**: Can start after Phase 2 — fully independent admin interface

### Within Each User Story

- Queries/services before pages
- Components before pages that use them
- Server actions after the queries they depend on
- Core implementation before integration points

### Parallel Opportunities

Within Phase 2 (Foundational):
- T008–T013 can all run in parallel (different files, no dependencies)
- T015–T017 can all run in parallel (independent webhook handlers + UI setup)

Within Phase 3 (US1):
- T018–T020 (queries + CourseCard) can run in parallel
- T023–T026 (video, transcript, snippet, resource components) can run in parallel
- T030 (sign-in/sign-up pages) can run in parallel with lesson components

Within Phase 4 (US2):
- T032, T033, T035–T037 (interfaces, types, schema, parser, sanitizer) can run in parallel
- T046, T047 (LabStatus + ValidationFeedback components) can run in parallel

Within Phase 6 (US4):
- T058–T061 (query + all dashboard components) can run in parallel

---

## Parallel Example: User Story 2

```text
# Batch 1 — Types & interfaces (all [P], no dependencies):
T032: Define ContainerProvider interface in services/labs/src/orchestrator/interface.ts
T033: Define compiled plan + validation result types in services/labs/src/compiler/types.ts & validator/types.ts
T035: Lab definition Zod schema in services/labs/src/compiler/schema.ts
T036: YAML compiler in services/labs/src/compiler/parser.ts
T037: Output sanitizer in services/labs/src/validator/sanitizer.ts

# Batch 2 — Core providers (depends on Batch 1):
T034: Docker orchestrator provider in services/labs/src/orchestrator/docker.ts
T041: Validation runner in services/labs/src/validator/runner.ts

# Batch 3 — API endpoints (depends on Batch 2):
T038: Session handlers in services/labs/src/api/sessions.ts
T039: SSE event stream in services/labs/src/api/events.ts
T040: WebSocket terminal in services/labs/src/api/terminal.ts
T042: Validation endpoint in services/labs/src/api/validate.ts
T043: Janitor cleanup in services/labs/src/orchestrator/cleanup.ts

# Batch 4 — Web integration (depends on Batch 3):
T044: Lab Service API client in apps/web/src/lib/lab-client.ts
T045: Lab server actions in apps/web/src/server/actions/labs.ts
T046: LabStatusIndicator component (parallel)
T047: ValidationFeedback component (parallel)
T048: TerminalView component

# Batch 5 — Assembly (depends on Batch 4):
T049: LabPanel component
T050: Lab session page
T051: Lesson page lab integration
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T017) — **CRITICAL: blocks all stories**
3. Complete Phase 3: User Story 1 (T018–T031)
4. **STOP and VALIDATE**: Browse courses → sign up → watch lesson → resume → completion tracking
5. Deploy/demo if ready — this is the minimum product that delivers learning value

### Incremental Delivery

1. Setup + Foundational → Foundation ready (T001–T017)
2. Add US1 → Test independently → Deploy/Demo (**MVP! Video learning works**)
3. Add US2 → Test independently → Deploy/Demo (**Interactive labs live**)
4. Add US3 → Test independently → Deploy/Demo (**Monetization enabled**)
5. Add US4 → Test independently → Deploy/Demo (**Retention dashboard**)
6. Add US5 → Test independently → Deploy/Demo (**Self-service content authoring**)
7. Polish phase → Accessibility, performance, observability hardened

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (Phase 1–2)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (web app: catalog, lessons, video player)
   - **Developer B**: User Story 2 — Lab Service backend (T032–T043)
   - After US1 basics land: Developer A picks up US2 web integration (T044–T051)
   - **Developer C**: User Story 5 (admin interface — fully independent)
3. US3 + US4 can be picked up by any developer after US1 is stable

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Phase 2
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The spec does not request TDD — add test tasks later if needed
- Total: 74 tasks across 8 phases
