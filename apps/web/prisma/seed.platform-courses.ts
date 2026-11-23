/**
 * Seeds only the five courses of November 2026 (all DRAFT): Capsule and vCluster, Talos Linux, Kamaji, OpenFeature,
 * and legacy APIs as MCP tools through GraphQL. Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.platform-courses.ts
 *
 * Prereq: DATABASE_URL set (Postgres). pnpm db:seed runs these courses too, with every other course.
 */

import { PrismaClient } from "@prisma/client";
import { seedTenancyCourse } from "./seeds/tenancy-course";
import { seedTalosCourse } from "./seeds/talos-course";
import { seedKamajiCourse } from "./seeds/kamaji-course";
import { seedOpenFeatureCourse } from "./seeds/openfeature-course";
import { seedGraphqlMcpCourse } from "./seeds/graphql-mcp-course";

const prisma = new PrismaClient();

async function main() {
  await seedTenancyCourse(prisma);
  await seedTalosCourse(prisma);
  await seedKamajiCourse(prisma);
  await seedOpenFeatureCourse(prisma);
  await seedGraphqlMcpCourse(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
