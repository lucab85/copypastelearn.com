import { ImageResponse } from "next/og";

// Generates a 192×192 icon used by PWA manifest, Android home screen, etc.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";
export const runtime = "edge";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: 38,
          background: "linear-gradient(135deg, #09090b 0%, #111118 100%)",
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

        {/* Inner container with subtle border */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 128,
            height: 128,
            borderRadius: 26,
            background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))",
            border: "1.5px solid rgba(59,130,246,0.25)",
          }}
        >
          {/* Terminal prompt */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "-1.5px",
              marginTop: 2,
            }}
          >
            &gt;_
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
