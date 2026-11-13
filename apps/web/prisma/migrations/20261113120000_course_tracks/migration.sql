-- Course tracks: group the catalog into a few clear tracks, and let a DRAFT
-- course be announced ("coming soon") without publishing it.

-- CreateEnum
CREATE TYPE "CourseTrack" AS ENUM ('AI_AGENTS', 'AI_HOMELAB', 'FOUNDATIONS');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "track" "CourseTrack";
ALTER TABLE "Course" ADD COLUMN "announced" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Course_track_idx" ON "Course"("track");

-- Assign the existing courses by slug. Courses not listed keep track NULL and
-- show under "More courses". Nothing is published or announced here.
UPDATE "Course" SET "track" = 'AI_AGENTS' WHERE "slug" IN (
  'kagent-ai-agents-on-kubernetes',
  'build-and-secure-an-mcp-server',
  'coding-agents-in-production-goose-agents-md',
  'openclaw-agent',
  'claude-code-masterclass',
  'claude-code-bootcamp',
  'mlflow-kubernetes-mlops'
);
UPDATE "Course" SET "track" = 'FOUNDATIONS' WHERE "slug" IN (
  'ansible-quickstart',
  'docker-fundamentals',
  'terraform-beginners',
  'selinux-system-admins',
  'nodejs-rest-apis'
);
