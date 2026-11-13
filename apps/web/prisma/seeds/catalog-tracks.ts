/**
 * Catalog tracks and upcoming courses.
 *
 * 1. Sets `track` on the known courses, only where it is still NULL, so a
 *    track changed in the admin is never reset by a re-run.
 * 2. Creates the courses in preparation as DRAFT stubs (course record only,
 *    no lessons) with `announced: false`. Nothing shows on the site until a
 *    stub is announced ("coming soon") or published. `update: {}` keeps any
 *    later edit; a full course seed with the same slug can fill in the rest.
 */

import type { PrismaClient, CourseTrack, Difficulty } from "@prisma/client";

const TRACK_BY_SLUG: Record<string, CourseTrack> = {
  "kagent-ai-agents-on-kubernetes": "AI_AGENTS",
  "build-and-secure-an-mcp-server": "AI_AGENTS",
  "coding-agents-in-production-goose-agents-md": "AI_AGENTS",
  "openclaw-agent": "AI_AGENTS",
  "claude-code-masterclass": "AI_AGENTS",
  "claude-code-bootcamp": "AI_AGENTS",
  "mlflow-kubernetes-mlops": "AI_AGENTS",
  "ansible-quickstart": "FOUNDATIONS",
  "docker-fundamentals": "FOUNDATIONS",
  "terraform-beginners": "FOUNDATIONS",
  "selinux-system-admins": "FOUNDATIONS",
  "nodejs-rest-apis": "FOUNDATIONS",
};

interface Stub {
  slug: string;
  title: string;
  description: string;
  track: CourseTrack;
  difficulty: Difficulty;
}

const UPCOMING: Stub[] = [
  {
    slug: "build-durable-ai-agents-with-dapr-agents",
    title: "Build Durable AI Agents with Dapr Agents",
    description:
      "Agents that survive restarts: workflows, state and pub/sub with Dapr Agents, from the first agent to a multi-agent system.",
    track: "AI_AGENTS",
    difficulty: "INTERMEDIATE",
  },
  {
    slug: "observe-and-debug-ai-agents-with-opentelemetry",
    title: "Observe and Debug AI Agents with OpenTelemetry",
    description:
      "Trace every model call and tool call of an agent, read the traces, and find why a run was slow, expensive or wrong.",
    track: "AI_AGENTS",
    difficulty: "INTERMEDIATE",
  },
  {
    slug: "reproducible-homelab-server",
    title: "Turn a Mac mini into a Reproducible Homelab Server",
    description:
      "Remote access, Homebrew with a Brewfile, power settings, and Infrastructure as Code with make, so the whole setup can be rebuilt from a repository.",
    track: "AI_HOMELAB",
    difficulty: "BEGINNER",
  },
  {
    slug: "virtual-machines-on-apple-silicon",
    title: "Virtual Machines on Apple Silicon",
    description:
      "Linux virtual machines with Colima and Lima on Apple Virtualization: file sharing, amd64 images with Rosetta, sizing, and starting at boot.",
    track: "AI_HOMELAB",
    difficulty: "BEGINNER",
  },
  {
    slug: "kubernetes-on-your-mac",
    title: "Kubernetes on Your Mac",
    description:
      "A multi-node cluster with kind, kubectl and Helm, an ingress, and a cluster you can tear down and recreate in minutes.",
    track: "AI_HOMELAB",
    difficulty: "BEGINNER",
  },
  {
    slug: "local-ai-on-apple-silicon",
    title: "Local AI on Apple Silicon",
    description:
      "Run models on the Mac's GPU with Ollama, choose models for your memory, and use the OpenAI-compatible API from code and from agents.",
    track: "AI_HOMELAB",
    difficulty: "BEGINNER",
  },
  {
    slug: "clone-your-voice-locally",
    title: "Clone Your Voice Locally",
    description:
      "Text to speech in your own voice with MLX audio models, checked with Whisper, to narrate videos without a cloud service.",
    track: "AI_HOMELAB",
    difficulty: "INTERMEDIATE",
  },
  {
    slug: "self-host-postiz",
    title: "Self-Host a Social Media Scheduler",
    description:
      "Postiz with Docker Compose: generated secrets, localhost-only ports, pinned images and upgrades.",
    track: "AI_HOMELAB",
    difficulty: "INTERMEDIATE",
  },
  {
    slug: "backup-and-restore",
    title: "Back Up and Restore a Homelab",
    description:
      "Database dumps, volume archives and checksums, a restore you have tested, and a rebuild from zero.",
    track: "AI_HOMELAB",
    difficulty: "INTERMEDIATE",
  },
  {
    slug: "hermes-agent",
    title: "A Personal AI Agent on Your Mac with Hermes Agent",
    description:
      "An always-on open-source agent on a local model: tools and approvals, skills and memory, an MCP server, scheduled tasks, and safety settings.",
    track: "AI_HOMELAB",
    difficulty: "INTERMEDIATE",
  },
  {
    slug: "local-ai-offload",
    title: "Spend Fewer Cloud Tokens: Offload Work to a Local Model",
    description:
      "A rule for what runs locally and what goes to the cloud, measured on your own Mac, with four working offloads and a before/after usage table.",
    track: "AI_HOMELAB",
    difficulty: "INTERMEDIATE",
  },
  {
    slug: "monitor-homelab-opentelemetry",
    title: "Know What Your Homelab Is Doing with OpenTelemetry",
    description:
      "Metrics, dashboards and alerts on your phone for a Mac that runs services and long jobs, with nothing sent to third parties.",
    track: "AI_HOMELAB",
    difficulty: "INTERMEDIATE",
  },
];

export async function seedCatalogTracks(prisma: PrismaClient) {
  for (const [slug, track] of Object.entries(TRACK_BY_SLUG)) {
    await prisma.course.updateMany({ where: { slug, track: null }, data: { track } });
  }

  const last = await prisma.course.aggregate({ _max: { sortOrder: true } });
  let sortOrder = (last._max.sortOrder ?? 0) + 1;
  for (const stub of UPCOMING) {
    const existing = await prisma.course.findUnique({ where: { slug: stub.slug } });
    if (existing) continue;
    await prisma.course.create({
      data: {
        ...stub,
        status: "DRAFT",
        announced: false,
        outcomes: [],
        prerequisites: [],
        sortOrder: sortOrder++,
      },
    });
  }
  console.log("  ✓ Catalog tracks set, upcoming course stubs created (DRAFT)");
}
