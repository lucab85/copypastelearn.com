import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates = [
  { slug: "introduction-to-ansible", videoPlaybackId: "pSBrSxIymfVHuQTpy4sYNorkvIHISxVhj4mNjhlu4bI" },
  { slug: "installing-configuring-ansible", videoPlaybackId: "4Gj5SoXO02101M6k2vFztwApeaHi1iXlil01GtSWYM1802A" },
  { slug: "building-first-playbook", videoPlaybackId: "QqgLJxDO41fqlOqGNs6MDO67MFPgre2rX7PSSvcIya8" },
  { slug: "using-ansible-modules", videoPlaybackId: "BsVCQ4r6YS017o6ivwD9DSC3FM00Y9GhKvndq019d57WAQ" },
  { slug: "simple-automation-project", videoPlaybackId: "01m3402uRFFktlDx00X3whDGZPLFEvotRDSyE6D1B7yI6w" },
  { slug: "course-project-walkthrough", videoPlaybackId: "nmu3Ufzo2lnsbUehGfnWTAidcIgLOJfmhvukXYEntMc" },
];

async function main() {
  console.log("Updating Mux Playback IDs...\n");

  for (const u of updates) {
    const result = await prisma.lesson.updateMany({
      where: { slug: u.slug },
      data: { videoPlaybackId: u.videoPlaybackId },
    });
    console.log(`  ${u.slug} -> ${u.videoPlaybackId} (${result.count} updated)`);
  }

  // Verify
  const lessons = await prisma.lesson.findMany({
    where: { slug: { in: updates.map((u) => u.slug) } },
    select: { slug: true, videoPlaybackId: true },
  });

  console.log("\nVerification:");
  for (const l of lessons) {
    console.log(`  ${l.slug} -> ${l.videoPlaybackId}`);
  }

  await prisma.$disconnect();
  console.log("\nDone!");
}

main();
