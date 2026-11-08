/**
 * Seeds only the kagent course (DRAFT). Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.kagent.ts
 *
 * Prereq: DATABASE_URL set (Postgres). pnpm db:seed runs this course too,
 * together with every other course in prisma/seed.ts.
 */

import { PrismaClient } from "@prisma/client";
import { seedKagentCourse } from "./seeds/kagent-course";

const prisma = new PrismaClient();

seedKagentCourse(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
