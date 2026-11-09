/**
 * Seeds only the MCP course (DRAFT). Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.mcp.ts
 *
 * Prereq: DATABASE_URL set (Postgres). Not wired into prisma/seed.ts yet: the courses
 * are wired together later.
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
