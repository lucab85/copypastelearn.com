# Feature Specification: CopyPasteLearn MVP Platform

**Feature Branch**: `001-mvp-platform`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "CopyPasteLearn — Video Courses with Integrated Interactive Labs (MVP)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse & Watch Video Lessons (Priority: P1)

A visitor discovers the platform, browses the course catalog, views course details (outcomes, difficulty, prerequisites, lesson list), creates an account, and watches video lessons. Logged-in learners see a video player with optional transcript, copyable code snippets, and downloadable resources. Lesson completion is tracked, and the learner can resume from where they left off.

**Why this priority**: Video lesson delivery is the foundation of the product. Without it there is no learning experience to build labs on top of. Browsing and watching is the minimum viable product that delivers user value even without labs.

**Independent Test**: A new visitor can discover a published course, read its details, sign up, watch a lesson from start to finish, close the browser, return later, and resume the same lesson at the saved position. Progress shows the lesson as completed after the video ends.

**Acceptance Scenarios**:

1. **Given** a visitor on the homepage, **When** they navigate to the course catalog, **Then** they see a list of published courses with title, description, difficulty, and a thumbnail.
2. **Given** a visitor viewing a course detail page, **When** they review the page, **Then** they see course outcomes, prerequisites, difficulty level, and a list of lessons with titles and durations.
3. **Given** an unauthenticated visitor on a lesson page, **When** they attempt to play a video, **Then** they are prompted to sign up or log in before the video plays.
4. **Given** an authenticated learner on a lesson page, **When** the page loads, **Then** they see a video player, an optional transcript panel, copyable code snippets, and a resources section (if the lesson has downloadable resources).
5. **Given** an authenticated learner watching a lesson, **When** they pause or leave mid-video, **Then** the system records the current playback position.
6. **Given** an authenticated learner returning to a previously started lesson, **When** the lesson page loads, **Then** the video resumes from the saved position.
7. **Given** an authenticated learner who has watched a lesson to the end, **When** the video finishes, **Then** the lesson is marked as completed and the next lesson is suggested.

---

### User Story 2 — Launch and Complete an Interactive Lab (Priority: P2)

A learner opens a lesson that has an associated lab, launches the lab environment with a single action, and enters a split-view experience with step-by-step instructions on one side and a terminal-like interaction area on the other. The learner follows instructions, runs automation commands, and triggers a validation action that checks whether the expected outcome was achieved. The system returns structured feedback explaining what passed, what failed, and hints for fixing failures. The learner can retry, and their attempts are recorded. When the lab is completed or the time limit expires, the environment is automatically cleaned up.

**Why this priority**: Interactive labs are the core differentiator of CopyPasteLearn. Without labs the platform is a generic video course site. Labs transform passive video watching into active hands-on practice.

**Independent Test**: A subscribed learner navigates to a lesson with an attached lab, launches the lab, sees it provision and become ready, reads step instructions, executes a command in the terminal area, clicks "Validate," receives pass/fail feedback with explanations, retries on failure, and eventually completes the lab. The lab session is cleaned up after completion or when the time limit expires.

**Acceptance Scenarios**:

1. **Given** a subscribed learner on a lesson page with an attached lab, **When** they click "Start Lab," **Then** the system begins provisioning and displays a clear status indicator (Provisioning → Ready).
2. **Given** a lab that has finished provisioning, **When** the status changes to Ready, **Then** the learner sees a split-view layout with step instructions and a terminal-like interaction area.
3. **Given** a learner in an active lab session, **When** they execute a command in the terminal area, **Then** the command runs in the isolated lab environment and the output is displayed (sanitized).
4. **Given** a learner who has attempted a lab step, **When** they click "Validate," **Then** the system runs a deterministic validation check and returns structured feedback: which checks passed, which failed, and a hint for each failure.
5. **Given** a learner who failed a validation, **When** they read the feedback and retry, **Then** they can re-run the validation without restarting the entire lab.
6. **Given** a learner with an active lab session, **When** the lab's time limit is reached, **Then** the system displays a clear expiration message and offers the option to restart the lab from scratch.
7. **Given** a learner who completes all lab steps successfully, **When** the final validation passes, **Then** the lab is marked as completed, the learner's progress is recorded, and the environment is scheduled for cleanup.
8. **Given** a learner who launched a lab and navigates away, **When** they return before the time limit, **Then** they can resume the active lab session at the step they were on.

---

### User Story 3 — Subscribe to Access Premium Content (Priority: P3)

A visitor or free-tier learner encounters a paywall when trying to access premium lessons or labs. The system presents a clear value proposition and pricing page. The learner subscribes to a single plan, gains immediate access to all premium content and labs, and can manage (cancel) their subscription from their account settings.

**Why this priority**: Monetization is essential for sustainability, but the product must first demonstrate value (video lessons, labs) before asking users to pay. A simple one-plan subscription is the minimum viable monetization that gates premium content.

**Independent Test**: A learner who is not subscribed attempts to access a premium lesson, sees a paywall with pricing, subscribes, and immediately gains access. They can then cancel from account settings and lose access at the end of the billing period.

**Acceptance Scenarios**:

1. **Given** a logged-in learner who is not subscribed, **When** they navigate to a premium lesson or attempt to start a lab, **Then** they see a paywall message with a clear value proposition and a link to the pricing page.
2. **Given** a learner on the pricing page, **When** they review the page, **Then** they see one subscription plan with a clear price, included benefits, and a prominent subscribe action.
3. **Given** a learner clicking the subscribe action, **When** payment is processed successfully, **Then** they are redirected back to the platform with immediate access to premium content and labs.
4. **Given** a subscribed learner, **When** they navigate to their account settings, **Then** they see their active subscription status and an option to cancel.
5. **Given** a subscribed learner who cancels, **When** the cancellation is confirmed, **Then** they retain access until the end of the current billing period, after which premium content and labs are gated again.

---

### User Story 4 — Learning Dashboard & Progress Overview (Priority: P4)

A returning learner lands on their personal dashboard, which shows courses in progress, a "Continue where you left off" prompt with the next lesson and/or active lab, completed courses, and overall progress indicators. The dashboard provides a calm, motivating overview that reduces the friction of resuming learning.

**Why this priority**: Retention depends on making it effortless to return and continue. The dashboard is the glue that ties lessons and labs into a coherent learning journey. It is lower priority than content delivery and labs because it depends on progress data generated by those flows.

**Independent Test**: A learner who has started two courses and completed several lessons logs in, sees the dashboard with accurate progress for each course, clicks "Continue" on a partially watched lesson, and lands on the lesson page at the saved position.

**Acceptance Scenarios**:

1. **Given** an authenticated learner with courses in progress, **When** they visit the dashboard, **Then** they see a list of in-progress courses with progress percentages and the next suggested lesson for each.
2. **Given** an authenticated learner with a recently active lesson, **When** the dashboard loads, **Then** a prominent "Continue where you left off" card shows the lesson title, course name, and a resume action.
3. **Given** an authenticated learner with completed courses, **When** they scroll the dashboard, **Then** they see a section for completed courses.
4. **Given** an authenticated learner with a lab in progress (not expired), **When** they visit the dashboard, **Then** the active lab session is shown with a "Resume Lab" action and remaining time.

---

### User Story 5 — Content Authoring & Publishing (Priority: P5)

An internal content author (admin) creates a new course, adds lessons with attached videos, attaches lab definitions to lessons, and publishes the course. Lab definitions are structured (declarative steps and validations) so they are repeatable and versionable. The author can save content as a draft before publishing.

**Why this priority**: Without authoring tools there is no content. However, authoring is an internal workflow used by a small audience, so it is lower priority than the learner-facing features. A basic admin interface is sufficient for MVP.

**Independent Test**: An admin creates a course with a title and description, adds two lessons each with a video and one with a lab definition, saves as draft, previews, and publishes. Learners can then see and access the newly published course.

**Acceptance Scenarios**:

1. **Given** an authenticated admin user, **When** they access the content management area, **Then** they see a list of all courses (draft and published) with status indicators.
2. **Given** an admin creating a new course, **When** they fill in title, description, outcomes, prerequisites, and difficulty, **Then** the course is saved as a draft.
3. **Given** an admin editing a draft course, **When** they add a lesson with a title, description, and a video reference (playback ID), **Then** the lesson is attached to the course in the specified order.
4. **Given** an admin editing a lesson, **When** they attach a lab definition (structured steps and validations), **Then** the lab is associated with that lesson and the definition is stored in a versioned format.
5. **Given** an admin with a complete draft course, **When** they publish it, **Then** the course becomes visible in the public catalog and accessible to learners (subject to subscription gating).
6. **Given** a published course, **When** an admin edits it, **Then** changes are saved as a new draft version that does not affect the live course until explicitly re-published.

---

### Edge Cases

- **Lab provisioning failure**: If the lab environment fails to provision, the learner sees a friendly error message with the option to retry. The system logs the failure with a correlation ID. No orphaned resources are left behind.
- **Lab session expires mid-work**: The learner is notified clearly that the session expired and is offered a "Restart Lab" action. Previous attempt data (which step they were on, how many attempts) is preserved for context.
- **Concurrent lab limit reached**: If a learner already has the maximum number of active lab sessions, they see a clear message explaining the limit and are offered the option to end an existing session to free up capacity.
- **Video playback failure**: If the video player fails to load or the stream is unavailable, the learner sees a friendly error with a retry action and an option to report the issue.
- **Payment failure during subscription**: If payment processing fails, the learner sees a clear error (without leaking payment details) and is offered the option to retry with a different payment method.
- **Subscription lapses while lab is active**: If a learner's subscription expires while a lab is in progress, the active lab session continues until its own TTL expires, but the learner cannot start new labs or access new premium content.
- **Browser tab closed during lab**: The lab session stays alive on the server until its TTL. When the learner returns (within TTL), they resume the active session. If the TTL has passed, they see an expiration message and can restart.
- **Stale progress data**: If a learner has progress for a lesson that was later removed from a course, the dashboard does not display orphaned progress entries. Completed course progress remains valid even if individual lessons change.
- **Admin unpublishes a course with active learners**: Enrolled learners retain access to content they had already started. New learners cannot discover or start the unpublished course.
- **Network interruption during validation**: If the connection drops while a lab validation is in progress, the system completes the validation server-side and stores the result. When the learner reconnects, they see the validation outcome.

## Requirements *(mandatory)*

### Functional Requirements

**Course catalog & discovery**

- **FR-001**: System MUST display a public course catalog listing all published courses with title, description, difficulty level, and thumbnail.
- **FR-002**: System MUST provide a course detail page showing outcomes, prerequisites, difficulty, estimated duration, and an ordered list of lessons with titles and durations.
- **FR-003**: System MUST allow visitors to browse the catalog and course detail pages without authentication.

**Authentication & accounts**

- **FR-004**: System MUST allow users to create accounts and log in via Clerk-managed authentication (email/password and social providers as configured in Clerk).
- **FR-005**: System MUST gate video playback, lab access, and progress tracking behind authentication.
- **FR-006**: System MUST use `clerkUserId` as the unique user identifier across all platform services.

**Video lesson experience**

- **FR-007**: System MUST render a video player for each lesson using the lesson's associated playback ID.
- **FR-008**: System MUST display an optional transcript alongside the video player when transcript data is available.
- **FR-009**: System MUST display copyable code snippets within lessons. Clicking a snippet copies it to the clipboard and provides visual confirmation.
- **FR-010**: System MUST display downloadable resources (files, links) attached to a lesson when present.
- **FR-011**: System MUST persist the learner's video playback position so they can resume later.
- **FR-012**: System MUST mark a lesson as completed when the learner watches the video to the end (defined as reaching the final 5% of the video duration).
- **FR-013**: System MUST suggest the next lesson in the course sequence after the current lesson is completed.

**Lab experience**

- **FR-014**: System MUST allow a lesson to have an optional associated lab definition.
- **FR-015**: System MUST allow a subscribed learner to launch a lab session from within a lesson page with a single action ("Start Lab").
- **FR-016**: System MUST display lab status transitions clearly: Provisioning → Ready → Running → Validating → Completed / Expired.
- **FR-017**: System MUST present the lab in a split-view layout with step-by-step instructions on one side and a terminal-like interaction area on the other.
- **FR-018**: System MUST allow the learner to run commands in the terminal area, with output returned from the isolated lab environment (sanitized of secrets and internal details).
- **FR-019**: System MUST provide a "Validate" action that runs deterministic checks against the lab environment and returns structured feedback: pass/fail per check, with actionable hints for failures.
- **FR-020**: System MUST allow the learner to retry validation without restarting the lab session.
- **FR-021**: System MUST record attempt history per lab session (step reached, number of validation attempts, pass/fail outcomes).
- **FR-022**: System MUST enforce a hard time limit (TTL) on each lab session (default: 60 minutes) and automatically clean up the environment when the TTL expires.
- **FR-023**: System MUST allow a learner to resume an active lab session (within TTL) if they navigate away and return.
- **FR-024**: System MUST display a clear expiration message when a lab session's TTL is reached and offer a "Restart Lab" action.
- **FR-025**: System MUST enforce a maximum of 1 concurrent active lab session per user. A learner must end or wait for expiration of an active session before starting a new one.
- **FR-026**: System MUST ensure that lab environments are fully isolated — no access to other sessions, the host, or external networks (unless explicitly allowed in the lab definition).

**Progress & continuity**

- **FR-027**: System MUST track course-level progress (percentage of lessons completed) and display it to the learner.
- **FR-028**: System MUST track lesson-level progress (video position, completed status) and persist it across sessions.
- **FR-029**: System MUST track lab-level progress (current step, attempts, completion status) and persist it across sessions.
- **FR-030**: System MUST provide a learner dashboard showing in-progress courses, a "Continue where you left off" prompt, and completed courses.
- **FR-031**: System MUST show the learner's active lab session (if any) on the dashboard with a "Resume Lab" action and remaining time.

**Subscription & monetization**

- **FR-032**: System MUST support a single subscription plan (e.g., €9/month) managed through Clerk Billing with Stripe.
- **FR-033**: System MUST display a pricing page with the plan's price, included benefits, and a prominent subscribe action.
- **FR-034**: System MUST gate premium lessons and lab access behind an active subscription.
- **FR-035**: System MUST make the first lesson of each course freely accessible without a subscription, so visitors can sample the experience. All subsequent lessons and labs require an active subscription.
- **FR-036**: System MUST immediately grant access to premium content upon successful subscription payment.
- **FR-037**: System MUST allow subscribers to view their subscription status and cancel from account settings.
- **FR-038**: System MUST maintain access until the end of the billing period after cancellation.

**Content authoring (admin)**

- **FR-039**: System MUST provide an admin interface where authorized users can create, edit, and manage courses and lessons.
- **FR-040**: System MUST support draft and published states for courses. Only published courses appear in the public catalog.
- **FR-041**: System MUST allow admins to attach a video (by playback ID) to a lesson.
- **FR-042**: System MUST allow admins to attach a structured lab definition (declarative steps and validation rules) to a lesson.
- **FR-043**: System MUST version lab definitions so that changes are tracked and published versions remain stable for active learners.

**Security & operational**

- **FR-044**: System MUST authenticate and authorize every request to the Lab Service API.
- **FR-045**: System MUST sanitize all lab output before displaying it to the user (no secrets, internal endpoints, or infrastructure details).
- **FR-046**: System MUST log all lab session lifecycle events (create, provision, ready, validate, complete, expire, teardown) with correlation IDs.
- **FR-047**: System MUST run a janitor process that detects and reclaims orphaned or expired lab sessions.

**Accessibility**

- **FR-048**: System MUST conform to WCAG 2.1 Level A success criteria across all learner-facing pages (catalog, lesson, lab, dashboard, pricing, account settings).

### Key Entities

- **Course**: A container for an ordered sequence of lessons. Key attributes: title, description, outcomes, prerequisites, difficulty level, estimated duration, thumbnail, status (draft/published), created/updated timestamps.
- **Lesson**: A single learning unit within a course. Key attributes: title, description, video playback reference, optional transcript, code snippets, downloadable resources, ordering position within the course, optional associated lab definition, status (draft/published).
- **Lab Definition**: A declarative, versioned description of a lab exercise. Key attributes: ordered steps (instruction text, expected actions), validation rules per step (deterministic checks with pass/fail criteria and hint messages), environment configuration (allowed networking, resource limits, TTL override up to platform max), version number. Default TTL per session: 60 minutes.
- **User**: A learner or admin on the platform. Key attributes: unique identifier (clerkUserId), display name, email, role (learner/admin), subscription status, created timestamp.
- **User Progress (Course)**: Tracks a learner's progress within a course. Key attributes: user reference, course reference, percentage complete, started/completed timestamps.
- **User Progress (Lesson)**: Tracks a learner's progress within a lesson. Key attributes: user reference, lesson reference, video playback position, completed status, last accessed timestamp.
- **Lab Session**: A running instance of a lab for a specific learner. Key attributes: user reference, lab definition reference, status (provisioning/ready/running/validating/completed/expired), current step index, TTL/expiration time, created timestamp, environment identifier.
- **Lab Attempt**: A record of a validation attempt within a lab session. Key attributes: lab session reference, step index, validation result (pass/fail per check), hints returned, timestamp.
- **Subscription**: A record of a user's subscription status. Key attributes: user reference, plan identifier, status (active/cancelled/expired), current period start/end, payment reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can complete at least one full course (all lessons watched, all associated labs passed) end-to-end without requiring human support.
- **SC-002**: Lab provisioning succeeds on 95% or more of launch attempts without learner-visible errors.
- **SC-002a**: Lab environments become ready (Provisioning → Ready) within 60 seconds of the learner clicking "Start Lab" on 95% or more of successful launches.
- **SC-003**: Lab validation produces the same result when run twice in sequence with no intervening changes to the environment (100% deterministic).
- **SC-004**: No orphaned lab sessions remain running beyond 15 minutes past their TTL (zero resource leaks).
- **SC-005**: Learners can resume a previously started lesson at the saved video position within 3 seconds of page load.
- **SC-006**: The course catalog and course detail pages load within 2 seconds on a standard broadband connection.
- **SC-007**: At least 70% of learners who start a lab complete it successfully (measured across all labs over the first 30 days).
- **SC-008**: Visitor-to-signup conversion rate is measurable and tracked from day one.
- **SC-009**: Signup-to-subscriber conversion rate is measurable and tracked from day one.
- **SC-010**: Lesson completion rate (percentage of started lessons that are finished) is at least 60% across all learners.
- **SC-011**: Learners report (via qualitative feedback or satisfaction survey) that the experience feels comfortable, calm, and easy to follow.
- **SC-012**: The platform supports at least 2–3 published courses and 3–5 associated labs at launch without performance degradation.
- **SC-013**: All learner-facing pages pass WCAG 2.1 Level A automated checks (e.g., axe-core) with zero critical violations.

## Clarifications

### Session 2026-02-19

- Q: What is the default lab session TTL? → A: 60 minutes default per session.
- Q: What is the maximum concurrent lab sessions per user? → A: 1 active lab session at a time.
- Q: How is free vs. premium content determined? → A: First lesson of each course is always free; all others require subscription.
- Q: What is the lab provisioning time target? → A: Under 60 seconds.
- Q: What is the accessibility conformance target? → A: WCAG 2.1 Level A.

## Assumptions

- The initial content set is small (2–3 courses, 3–5 labs) and created by internal authors, not external contributors.
- Lab scenarios are pre-designed for reliability and determinism; arbitrary user-defined labs are out of scope.
- A single subscription plan is sufficient for MVP. Complex billing (usage-based, coupons, multi-tier) is deferred.
- Clerk handles all authentication flows (signup, login, password reset, social providers) without custom identity management.
- Video content is pre-uploaded to Mux; the platform references playback IDs rather than handling video uploads.
- Lab environments use pre-baked images to avoid transient dependency failures during provisioning.
- The Lab Service API is treated as an external service boundary; the web platform does not need to know or control its internal implementation.
- Standard web performance expectations apply (< 3s page loads, smooth interactions) unless specific metrics state otherwise.
- Data retention follows industry-standard practices for e-learning platforms; no special compliance (HIPAA, SOX) is required.
