import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          borderRadius: 6,
          background: "#09090b",
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
            height: 3,
            background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
          }}
        />
        {/* Terminal prompt >_ */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: "-0.5px",
            marginTop: 1,
          }}
        >
          &gt;_
        </div>
      </div>
    ),
    { ...size }
  );
}
