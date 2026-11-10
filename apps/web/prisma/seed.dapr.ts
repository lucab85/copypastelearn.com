/**
 * Seeds only the Dapr Agents course (DRAFT). Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.dapr.ts
 *
 * Prereq: DATABASE_URL set (Postgres). pnpm db:seed runs this course too, with every other course.
 */

import { PrismaClient } from "@prisma/client";
import { seedDaprCourse } from "./seeds/dapr-agents-course";

const prisma = new PrismaClient();

seedDaprCourse(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
