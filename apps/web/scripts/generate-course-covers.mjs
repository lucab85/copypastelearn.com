#!/usr/bin/env node
/**
 * Course covers: public/images/courses/<slug>.svg (800x450, 16:9).
 *
 *   node scripts/generate-course-covers.mjs          write missing covers
 *   node scripts/generate-course-covers.mjs --force  rewrite all covers listed here
 *
 * A typographic cover: track, course title, and one real command of the course
 * (copy, paste, learn). No drawings, no gradients, no glow: the title has to be
 * readable on a phone-width card. Hand-made covers in the same folder are never
 * touched (they are not in the list below).
 *
 * The seed and the course import set Course.thumbnailUrl to
 * /images/courses/<slug>.svg when that file exists and the course has no cover.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "courses");

const TRACKS = {
  AI_AGENTS: { label: "AI AGENTS", accent: "#fbbf24" },
  AI_HOMELAB: { label: "AI HOMELAB ON A MAC MINI", accent: "#34d399" },
};

/** `command` is a line the course really runs; leave it out rather than invent one. */
const COVERS = [
  { slug: "kagent-ai-agents-on-kubernetes", track: "AI_AGENTS", title: "kagent 1.0: Run AI Agents on Kubernetes", command: "kind create cluster --name kagent" },
  { slug: "build-and-secure-an-mcp-server", track: "AI_AGENTS", title: "Build and Secure an MCP Server", command: '@mcp.tool(title="Search runbooks")' },
  { slug: "coding-agents-in-production-goose-agents-md", track: "AI_AGENTS", title: "Run Coding Agents in Production with goose and AGENTS.md", command: "goose info --check" },
  { slug: "build-durable-ai-agents-with-dapr-agents", track: "AI_AGENTS", title: "Build Durable AI Agents with Dapr Agents" },
  { slug: "observe-and-debug-ai-agents-with-opentelemetry", track: "AI_AGENTS", title: "Observe and Debug AI Agents with OpenTelemetry" },
  { slug: "reproducible-homelab-server", track: "AI_HOMELAB", title: "Turn a Mac mini into a Reproducible Homelab Server", command: "brew bundle install" },
  { slug: "virtual-machines-on-apple-silicon", track: "AI_HOMELAB", title: "Virtual Machines on Apple Silicon", command: "colima ssh -p lab -- uname -srm" },
  { slug: "kubernetes-on-your-mac", track: "AI_HOMELAB", title: "Kubernetes on Your Mac", command: "kind create cluster --config cluster.yaml" },
  { slug: "local-ai-on-apple-silicon", track: "AI_HOMELAB", title: "Local AI on Apple Silicon", command: "ollama run gemma4:e4b" },
  { slug: "clone-your-voice-locally", track: "AI_HOMELAB", title: "Clone Your Voice Locally", command: 'say.py chatterbox --ref voice/ref.wav "New text."' },
  { slug: "self-host-postiz", track: "AI_HOMELAB", title: "Self-Host a Social Media Scheduler", command: "docker compose config --quiet" },
  { slug: "backup-and-restore", track: "AI_HOMELAB", title: "Back Up and Restore a Homelab" },
  { slug: "hermes-agent", track: "AI_HOMELAB", title: "A Personal AI Agent on Your Mac with Hermes Agent", command: "hermes config set model.provider custom" },
  { slug: "local-ai-offload", track: "AI_HOMELAB", title: "Spend Fewer Cloud Tokens: Offload Work to a Local Model" },
  { slug: "monitor-homelab-opentelemetry", track: "AI_HOMELAB", title: "Know What Your Homelab Is Doing with OpenTelemetry", command: "curl -s localhost:9100/metrics | grep -c '^node_'" },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? line + " " + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

export function cover({ title, track, command }) {
  const t = TRACKS[track];
  let size = 50;
  let lines = wrap(title, 24);
  if (lines.length > 3) {
    size = 42;
    lines = wrap(title, 29);
  }
  const lineHeight = Math.round(size * 1.18);
  const top = 150 + (3 - Math.min(lines.length, 3)) * 14;
  const sans = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="${esc(title)}">
  <rect width="800" height="450" fill="#0b1120"/>
  <text x="56" y="84" fill="${t.accent}" font-family="${sans}" font-size="17" font-weight="600" letter-spacing="2">${esc(t.label)}</text>
${lines.map((l, i) => `  <text x="56" y="${top + i * lineHeight}" fill="#f8fafc" font-family="${sans}" font-size="${size}" font-weight="700">${esc(l)}</text>`).join("\n")}
${command ? `  <rect x="0" y="362" width="800" height="88" fill="#131c31"/>
  <text x="56" y="414" font-family="${mono}" font-size="22" fill="#e2e8f0"><tspan fill="${t.accent}">$ </tspan>${esc(command)}</text>` : `  <rect x="56" y="388" width="72" height="4" fill="${t.accent}"/>`}
</svg>
`;
}

const force = process.argv.includes("--force");
fs.mkdirSync(OUT, { recursive: true });
for (const c of COVERS) {
  const file = path.join(OUT, `${c.slug}.svg`);
  if (fs.existsSync(file) && !force) continue;
  fs.writeFileSync(file, cover(c));
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
