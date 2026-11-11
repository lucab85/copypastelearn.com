/**
 * Seeds only the goose and AGENTS.md course (DRAFT). Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.goose.ts
 *
 * Prereq: DATABASE_URL set (Postgres). pnpm db:seed runs this course too, with every other course.
 */

import { PrismaClient } from "@prisma/client";
import { seedGooseCourse } from "./seeds/goose-course";

const prisma = new PrismaClient();

seedGooseCourse(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
