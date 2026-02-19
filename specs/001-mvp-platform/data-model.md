# Data Model: CopyPasteLearn MVP Platform

**Branch**: `001-mvp-platform` | **Date**: 2026-02-19

## Entity Relationship Overview

```text
User (clerkUserId)
 ├── has many → CourseProgress
 │                └── belongs to → Course
 ├── has many → LessonProgress
 │                └── belongs to → Lesson
 ├── has many → LabSession
 │                ├── belongs to → LabDefinition
 │                └── has many → LabAttempt
 └── has one  → Subscription (synced from Clerk)

Course
 └── has many → Lesson (ordered)
                 └── has optional → LabDefinition (versioned)
```

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── User ───────────────────────────────────────────────
// Synced from Clerk. clerkUserId is the unique identifier.
// Clerk is the source of truth for identity; this table
// stores platform-specific data only.

model User {
  id           String   @id @default(cuid())
  clerkUserId  String   @unique
  email        String
  displayName  String?
  role         Role     @default(LEARNER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  courseProgress  CourseProgress[]
  lessonProgress  LessonProgress[]
  labSessions     LabSession[]
  subscription    Subscription?

  @@index([clerkUserId])
}

enum Role {
  LEARNER
  ADMIN
}

// ─── Course ─────────────────────────────────────────────

model Course {
  id            String       @id @default(cuid())
  title         String
  slug          String       @unique
  description   String
  outcomes      String[]     // Array of outcome strings
  prerequisites String[]     // Array of prerequisite strings
  difficulty    Difficulty
  estimatedDuration Int?     // Total duration in minutes
  thumbnailUrl  String?
  status        ContentStatus @default(DRAFT)
  sortOrder     Int          @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  lessons        Lesson[]
  courseProgress  CourseProgress[]

  @@index([status])
  @@index([slug])
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

// ─── Lesson ─────────────────────────────────────────────

model Lesson {
  id              String        @id @default(cuid())
  courseId         String
  title           String
  slug            String
  description     String?
  videoPlaybackId String?       // Mux playback ID
  transcript      String?       // Plain text transcript
  codeSnippets    Json?         // Array of { label, language, code }
  resources       Json?         // Array of { title, url, type }
  sortOrder       Int           @default(0)
  durationSeconds Int?          // Video duration in seconds
  status          ContentStatus @default(DRAFT)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  course          Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  labDefinition   LabDefinition?
  lessonProgress  LessonProgress[]

  @@unique([courseId, slug])
  @@index([courseId, sortOrder])
}

// ─── Lab Definition ─────────────────────────────────────
// Versioned, declarative description of a lab exercise.
// The YAML source is stored as text; the compiled plan
// is stored as JSON for runtime use.

model LabDefinition {
  id              String   @id @default(cuid())
  lessonId        String   @unique
  version         Int      @default(1)
  yamlSource      String   // Raw YAML lab definition
  compiledPlan    Json     // Compiled execution plan (steps, checks, config)
  envConfig       Json?    // Environment configuration (image, resources, networking)
  ttlMinutes      Int      @default(60)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  lesson      Lesson       @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  labSessions LabSession[]

  @@index([lessonId])
}

// ─── Lab Session ────────────────────────────────────────
// A running (or completed) instance of a lab for a user.

model LabSession {
  id                String          @id @default(cuid())
  userId            String
  labDefinitionId   String
  status            LabSessionStatus @default(PROVISIONING)
  currentStepIndex  Int             @default(0)
  sandboxId         String?         // External container/sandbox identifier
  expiresAt         DateTime        // Hard TTL deadline
  startedAt         DateTime        @default(now())
  completedAt       DateTime?
  destroyedAt       DateTime?

  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  labDefinition  LabDefinition  @relation(fields: [labDefinitionId], references: [id])
  attempts       LabAttempt[]

  @@index([userId, status])
  @@index([status, expiresAt])  // For janitor queries
  @@index([labDefinitionId])
}

enum LabSessionStatus {
  PROVISIONING
  READY
  RUNNING
  VALIDATING
  COMPLETED
  EXPIRED
  FAILED
  DESTROYED
}

// ─── Lab Attempt ────────────────────────────────────────
// A validation attempt within a lab session.

model LabAttempt {
  id             String   @id @default(cuid())
  labSessionId   String
  stepIndex      Int
  passed         Boolean
  results        Json     // Array of { checkName, passed, message, hint }
  createdAt      DateTime @default(now())

  labSession LabSession @relation(fields: [labSessionId], references: [id], onDelete: Cascade)

  @@index([labSessionId, stepIndex])
}

// ─── Course Progress ────────────────────────────────────

model CourseProgress {
  id              String    @id @default(cuid())
  userId          String
  courseId         String
  percentComplete Float     @default(0)
  startedAt       DateTime  @default(now())
  completedAt     DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
}

// ─── Lesson Progress ────────────────────────────────────

model LessonProgress {
  id                  String    @id @default(cuid())
  userId              String
  lessonId            String
  videoPositionSeconds Float    @default(0)  // Resume position
  completed           Boolean   @default(false)
  lastAccessedAt      DateTime  @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId, lastAccessedAt])
}

// ─── Subscription ───────────────────────────────────────
// Synced from Clerk Billing webhooks. Clerk is source of
// truth; this is a local cache for fast reads and analytics.

model Subscription {
  id                String             @id @default(cuid())
  userId            String             @unique
  clerkSubscriptionId String?          @unique
  planId            String
  status            SubscriptionStatus
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  canceledAt        DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status])
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  EXPIRED
  PAST_DUE
}
```

## Key Design Notes

1. **User identity**: `clerkUserId` is the foreign key used in queries. The `User.id` (cuid) is the internal relational key for Prisma relations. Both are indexed.

2. **Lab Definition versioning**: The `version` field is an integer that increments on each publish. The `yamlSource` + `compiledPlan` fields store the complete definition at that version. For MVP, only the latest version is active; historical versions can be stored in a separate `LabDefinitionVersion` table post-MVP if needed.

3. **Lab Session lifecycle**: The `status` enum maps directly to the event model (provisioning → ready → running → validating → completed/failed → destroyed). The `expiresAt` field is set at creation to `now() + ttlMinutes`. The janitor queries `WHERE status NOT IN ('COMPLETED', 'EXPIRED', 'DESTROYED') AND expiresAt < now()`.

4. **Subscription as cache**: The `Subscription` table is populated by Clerk Billing webhooks. For gating decisions, the web app first checks this table; if stale (e.g., webhook missed), it falls back to a Clerk SDK call. This avoids latency on every page load while maintaining correctness.

5. **Free lesson rule**: The first lesson of each course (lowest `sortOrder`) is free. This is enforced in application logic (server action / query), not in the database schema — no `isFree` column needed because the rule is positional.
