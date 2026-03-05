import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Platform Engineering for Enterprise Leaders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AIPlatformOGImage() {
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
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(to right, #f59e0b, #ef4444, #f59e0b)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40 }}>
          <div style={{ fontSize: 18, color: "#f59e0b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Live Program
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.025em" }}>
            AI Platform Engineering
          </div>
          <div style={{ fontSize: 24, color: "#a1a1aa", lineHeight: 1.4 }}>
            6-week program for CTOs &amp; CIOs — stop burning budget on AI projects that never reach production.
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
          {["Strategy", "Architecture", "GPU Ops", "MLOps", "Security", "Scale"].map((t) => (
            <div key={t} style={{ padding: "8px 16px", borderRadius: 8, backgroundColor: "#18181b", border: "1px solid #27272a", fontSize: 16, fontWeight: 600 }}>
              {t}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, backgroundColor: "#3b82f6", fontSize: 20, fontWeight: 700 }}>
              &gt;_
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>CopyPasteLearn</div>
          </div>
          <div style={{ fontSize: 16, color: "#52525b" }}>
            copypastelearn.com/ai-platform-engineering
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
