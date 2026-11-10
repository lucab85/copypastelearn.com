/**
 * Seeds only the MCP course (DRAFT). Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.mcp.ts
 *
 * Prereq: DATABASE_URL set (Postgres). pnpm db:seed runs this course too, with every other course.
 */

import { PrismaClient } from "@prisma/client";
import { seedMcpCourse } from "./seeds/mcp-course";

const prisma = new PrismaClient();

seedMcpCourse(prisma)
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
