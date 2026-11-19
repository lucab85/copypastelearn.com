import { ImageResponse } from "next/og";

// Static card: no database, so it is rendered once at build time and the
// /academy link previews instantly on LinkedIn, X and Slack. Without this file
// the page had no og:image at all (its own openGraph metadata replaced the
// parent's), so shared links showed no picture.
export const alt = "Agentic AI Academy: 5 courses on running AI agents in production";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COURSES = [
  { name: "kagent", topic: "AI agents on Kubernetes" },
  { name: "MCP", topic: "Build and secure a server" },
  { name: "goose + AGENTS.md", topic: "Coding agents in production" },
  { name: "Dapr Agents", topic: "Durable agent workflows" },
  { name: "OpenTelemetry", topic: "Observe and debug agents" },
];

export default function AcademyOGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "56px 80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Agentic AI Academy
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Run AI agents in production
          </div>
          <div style={{ fontSize: 22, color: "#a1a1aa" }}>
            5 video courses. Every command on screen. First lesson of each course free.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {COURSES.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "14px 18px",
                borderRadius: 12,
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                width: 330,
              }}
            >
              <div style={{ display: "flex", fontSize: 14, color: "#71717a", fontWeight: 600 }}>
                {`Course ${i + 1}`}
              </div>
              <div style={{ display: "flex", fontSize: 22, fontWeight: 700 }}>{c.name}</div>
              <div style={{ display: "flex", fontSize: 16, color: "#a1a1aa" }}>{c.topic}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: "#3b82f6",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              &gt;_
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>CopyPasteLearn</div>
          </div>
          <div style={{ fontSize: 16, color: "#52525b" }}>copypastelearn.com/academy</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
