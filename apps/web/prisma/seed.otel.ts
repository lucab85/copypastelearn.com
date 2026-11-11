/**
 * Seeds only the OpenTelemetry course (DRAFT). Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.otel.ts
 *
 * Prereq: DATABASE_URL set (Postgres). pnpm db:seed runs this course too, with every other course.
 */

import { PrismaClient } from "@prisma/client";
import { seedOtelCourse } from "./seeds/otel-agents-course";

const prisma = new PrismaClient();

seedOtelCourse(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
