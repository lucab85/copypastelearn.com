# copypastelearn.com Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-05-08

## Active Technologies

- TypeScript 5.x (strict), Node.js 20 LTS (matches existing apps/web). + Next.js 15 App Router, React 19, Prisma 5+, `stripe` (Node SDK), `@clerk/nextjs` (existing), `zod` (request validation), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (private file storage with presigned GETs), `resend` or `react-email` + a transactional provider (vendor decided in research.md), `@upstash/ratelimit` + Redis (rate limiting on agent + download endpoints). (002-agentic-commerce)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict), Node.js 20 LTS (matches existing apps/web).: Follow standard conventions

## Recent Changes

- 002-agentic-commerce: Added TypeScript 5.x (strict), Node.js 20 LTS (matches existing apps/web). + Next.js 15 App Router, React 19, Prisma 5+, `stripe` (Node SDK), `@clerk/nextjs` (existing), `zod` (request validation), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (private file storage with presigned GETs), `resend` or `react-email` + a transactional provider (vendor decided in research.md), `@upstash/ratelimit` + Redis (rate limiting on agent + download endpoints).

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
