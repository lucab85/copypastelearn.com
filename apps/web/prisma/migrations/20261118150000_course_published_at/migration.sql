-- Course.publishedAt: the day a course was first published. NULL = never published.
--
-- Safe to run once in production (prisma migrate deploy, Vercel production build):
--   * ADD COLUMN of a nullable column with no default only changes the catalog:
--     no table rewrite, no existing row is read or written by it.
--   * The two UPDATEs only fill rows that are PUBLISHED and still have no date,
--     so nothing is overwritten and running the statements again changes nothing.
--   * DRAFT courses keep NULL. No column or row is removed.

-- AlterTable
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- Backfill 1: the five Agentic AI Academy courses went live on 2026-11-18.
UPDATE "Course"
SET "publishedAt" = TIMESTAMP '2026-11-18 00:00:00'
WHERE "status" = 'PUBLISHED'
  AND "publishedAt" IS NULL
  AND "slug" IN (
    'kagent-ai-agents-on-kubernetes',
    'build-and-secure-an-mcp-server',
    'coding-agents-in-production-goose-agents-md',
    'build-durable-ai-agents-with-dapr-agents',
    'observe-and-debug-ai-agents-with-opentelemetry'
  );

-- Backfill 2: every other published course gets the date its record was created.
UPDATE "Course"
SET "publishedAt" = "createdAt"
WHERE "status" = 'PUBLISHED'
  AND "publishedAt" IS NULL;
