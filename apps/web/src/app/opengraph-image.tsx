import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CopyPasteLearn — Learn IT Automation by Doing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top accent bar */}
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

        {/* Terminal icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 16,
            backgroundColor: "#18181b",
            border: "2px solid #27272a",
            marginBottom: 32,
            fontSize: 40,
          }}
        >
          &gt;_
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            marginBottom: 16,
          }}
        >
          CopyPasteLearn
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            marginBottom: 40,
          }}
        >
          Learn IT Automation by Doing
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          {["Docker", "Ansible", "Node.js", "Hands-On Labs"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                backgroundColor: "#1e3a5f",
                color: "#93c5fd",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "#52525b",
          }}
        >
          copypastelearn.com
        </div>
      </div>
    ),
    { ...size }
  );
}
