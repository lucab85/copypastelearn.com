import type { CourseTrack } from "@copypastelearn/shared";

export interface TrackInfo {
  id: CourseTrack | "OTHER";
  anchor: string;
  title: string;
  tagline: string;
  description: string;
}

/** Catalog tracks, in display order. "OTHER" collects courses with no track. */
export const COURSE_TRACKS: TrackInfo[] = [
  {
    id: "AI_AGENTS",
    anchor: "ai-agents",
    title: "AI Agents",
    tagline: "Build, run and secure AI agents",
    description:
      "Agents on Kubernetes, MCP servers, coding agents in CI, and the tracing that tells you what they did.",
  },
  {
    id: "AI_HOMELAB",
    anchor: "ai-homelab",
    title: "AI Homelab on a Mac mini",
    tagline: "Your own AI server at home, on Apple Silicon",
    description:
      "Local models, virtual machines, Kubernetes, self-hosted apps, monitoring and backups. Every course stands alone: start from any of them.",
  },
  {
    id: "FOUNDATIONS",
    anchor: "foundations",
    title: "Foundations",
    tagline: "The basics every other course builds on",
    description:
      "Ansible, Docker, Terraform and Linux security, with hands-on labs in the browser.",
  },
  {
    id: "OTHER",
    anchor: "more-courses",
    title: "More courses",
    tagline: "",
    description: "",
  },
];
