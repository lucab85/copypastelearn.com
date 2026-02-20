# API Contract: Web App Routes

**Branch**: `001-mvp-platform` | **Date**: 2026-02-19

Framework: Next.js App Router (Server Components, Server Actions, Route Handlers)

Authentication: Clerk middleware protects all `(app)` routes. Public routes live in `(marketing)`.

---

## Route Groups

```text
app/
├── (marketing)/            → Public, unauthenticated
│   ├── page.tsx            → Homepage / landing
│   ├── courses/
│   │   ├── page.tsx        → Course catalog
│   │   └── [slug]/
│   │       └── page.tsx    → Course detail (public preview)
│   ├── pricing/
│   │   └── page.tsx        → Pricing page
│   ├── sign-in/[[...sign-in]]/
│   │   └── page.tsx        → Clerk sign-in
│   └── sign-up/[[...sign-up]]/
│       └── page.tsx        → Clerk sign-up
│
├── (app)/                  → Authenticated
│   ├── dashboard/
│   │   └── page.tsx        → Learning dashboard
│   ├── courses/[slug]/
│   │   ├── page.tsx        → Course detail (enrolled view)
│   │   └── lessons/[lessonSlug]/
│   │       └── page.tsx    → Lesson player (video + lab)
│   ├── labs/[sessionId]/
│   │   └── page.tsx        → Full-screen lab view
│   └── settings/
│       └── page.tsx        → Account & subscription management
│
├── api/                    → Route Handlers
│   └── webhooks/
│       ├── clerk/route.ts  → Clerk user sync webhook
│       └── stripe/route.ts → Stripe/Clerk Billing webhook
│
└── admin/                  → Admin (Clerk role: ADMIN)
    ├── layout.tsx          → Admin layout with role guard
    ├── courses/
    │   ├── page.tsx        → Course list
    │   ├── new/page.tsx    → Create course
    │   └── [id]/
    │       ├── page.tsx    → Edit course
    │       └── lessons/
    │           ├── new/page.tsx     → Create lesson
    │           └── [lessonId]/
    │               └── page.tsx     → Edit lesson + lab definition
    └── labs/
        └── page.tsx        → Lab sessions monitor
```

---

## Server Actions

Server actions are defined in `app/(app)/_actions/` and imported where needed.

### Course & Lesson Actions

#### `getCourses()`

Returns published courses with lesson count and user progress (if authenticated).

```typescript
// Return type
type CourseListItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  lessonCount: number;
  thumbnailUrl: string | null;
  userProgress?: { percentComplete: number } | null;
};
```

#### `getCourse(slug: string)`

Returns full course with ordered lessons. Respects free lesson rule (first lesson accessible to all; others gated by subscription).

```typescript
type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  outcomes: string[];
  prerequisites: string[];
  difficulty: Difficulty;
  estimatedDuration: number | null;
  lessons: LessonSummary[];
  userProgress?: CourseProgress | null;
};

type LessonSummary = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  durationSeconds: number | null;
  hasLab: boolean;
  isFree: boolean;          // true for sortOrder === 0
  isAccessible: boolean;    // true if free OR user has active subscription
  userProgress?: { completed: boolean; videoPositionSeconds: number } | null;
};
```

#### `getLesson(courseSlug: string, lessonSlug: string)`

Returns full lesson content. Throws `403` if lesson is not free and user lacks subscription.

```typescript
type LessonDetail = {
  id: string;
  title: string;
  courseSlug: string;
  videoPlaybackId: string | null;
  transcript: string | null;
  codeSnippets: CodeSnippet[] | null;
  resources: Resource[] | null;
  labDefinitionId: string | null;
  userProgress: LessonProgress | null;
  nextLesson: { slug: string; title: string } | null;
  previousLesson: { slug: string; title: string } | null;
};
```

### Progress Actions

#### `saveVideoPosition(lessonId: string, positionSeconds: number)`

Debounced save of video playback position. Creates or updates `LessonProgress`.

#### `markLessonComplete(lessonId: string)`

Marks lesson as completed. Recalculates and updates parent `CourseProgress.percentComplete`.

### Lab Actions

#### `createLabSession(labDefinitionId: string)`

Proxies to Lab Service `POST /sessions`. Returns session ID and initial status.

```typescript
type CreateLabSessionResult = {
  sessionId: string;
  status: LabSessionStatus;
  expiresAt: string;
};
```

#### `destroyLabSession(sessionId: string)`

Proxies to Lab Service `DELETE /sessions/:sessionId`.

#### `validateLabStep(sessionId: string, stepIndex?: number)`

Proxies to Lab Service `POST /sessions/:sessionId/validate`.

### Dashboard Actions

#### `getDashboard()`

Returns user's in-progress courses, recent lessons, and active lab session (if any).

```typescript
type DashboardData = {
  inProgressCourses: (CourseListItem & { percentComplete: number })[];
  recentLessons: {
    lessonTitle: string;
    courseTitle: string;
    courseSlug: string;
    lessonSlug: string;
    lastAccessedAt: string;
  }[];
  activeLabSession: {
    sessionId: string;
    labTitle: string;
    status: LabSessionStatus;
    expiresAt: string;
  } | null;
};
```

### Subscription Actions

#### `getSubscriptionStatus()`

Returns current subscription status from local cache, with Clerk SDK fallback.

```typescript
type SubscriptionInfo = {
  isSubscribed: boolean;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
};
```

---

## Webhook Route Handlers

### `POST /api/webhooks/clerk`

Handles Clerk webhook events for user synchronization.

**Events handled**:
- `user.created` → Create `User` record with `clerkUserId`, `email`, `displayName`
- `user.updated` → Update `email`, `displayName`
- `user.deleted` → Soft-delete or cascade-delete user data

**Security**: Validates Clerk webhook signature using `svix` library.

### `POST /api/webhooks/stripe`

Handles Clerk Billing / Stripe webhook events for subscription synchronization.

**Events handled**:
- `checkout.session.completed` → Create `Subscription` record (status: ACTIVE)
- `customer.subscription.updated` → Update `Subscription` status, period dates
- `customer.subscription.deleted` → Update `Subscription` status to CANCELED/EXPIRED
- `invoice.payment_failed` → Update `Subscription` status to PAST_DUE

**Security**: Validates Stripe webhook signature using `stripe` SDK (`constructEvent`).

---

## Middleware

### `middleware.ts` (root)

```typescript
// Clerk middleware configuration
// Public routes: /, /courses, /courses/[slug], /pricing, /sign-in, /sign-up, /api/webhooks/*
// Protected routes: /dashboard, /courses/[slug]/lessons/*, /labs/*, /settings, /admin/*
// Admin routes: /admin/* (additional role check in admin layout)
```

---

## API Response Patterns

### Success

Server actions return typed data directly (no wrapper). Errors throw and are caught by error boundaries.

### Error Handling

```typescript
// Custom error classes used in server actions
class UnauthorizedError extends Error { statusCode = 401; }
class ForbiddenError extends Error { statusCode = 403; }  // No subscription
class NotFoundError extends Error { statusCode = 404; }
class ConflictError extends Error { statusCode = 409; }   // Active lab session exists

// error.tsx boundary catches and displays user-friendly messages
```

### Caching Strategy

| Data | Strategy | Revalidation |
|------|----------|-------------|
| Course catalog | ISR (`revalidate: 3600`) | On-demand after admin publish |
| Course detail | ISR (`revalidate: 3600`) | On-demand after admin edit |
| Lesson content | Dynamic (auth-gated) | No cache |
| User progress | Dynamic | No cache |
| Dashboard | Dynamic | No cache |
| Subscription status | Dynamic + local DB cache | Webhook-driven |
