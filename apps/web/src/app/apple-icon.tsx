import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "edge";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: 36,
          background: "linear-gradient(135deg, #0c0c10 0%, #111118 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)",
          }}
        />

        {/* Outer glow ring */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
            border: "1.5px solid rgba(59,130,246,0.3)",
          }}
        >
          {/* Terminal prompt >_ */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "-1px",
              marginTop: 2,
            }}
          >
            &gt;_
          </div>
        </div>

        {/* Subtle bottom text */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "2px",
            color: "#52525b",
            textTransform: "uppercase",
          }}
        >
          CPL
        </div>
      </div>
    ),
    { ...size }
  );
}
