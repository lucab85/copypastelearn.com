import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CopyPasteLearn Pricing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function PricingOGImage() {
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
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Accent bar */}
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

        <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          Simple Pricing
        </div>

        <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 8 }}>
          €29
          <span style={{ fontSize: 28, fontWeight: 400, color: "#71717a" }}>/month</span>
        </div>

        <div style={{ fontSize: 22, color: "#a1a1aa", marginBottom: 32 }}>
          Everything included. No hidden fees.
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {["All Courses", "Interactive Labs", "Code Snippets", "Certificates"].map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16,
                color: "#d4d4d8",
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✓</div>
              {f}
            </div>
          ))}
        </div>

        {/* Footer */}
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
          <div style={{ fontSize: 16, color: "#52525b" }}>copypastelearn.com/pricing</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
