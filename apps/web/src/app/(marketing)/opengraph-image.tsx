import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CopyPasteLearn — Learn IT Automation by Doing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function MarketingOGImage() {
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
            background: "linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40 }}>
          <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            CopyPasteLearn
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.025em" }}>
            Learn IT Automation by Doing
          </div>
          <div style={{ fontSize: 22, color: "#a1a1aa", lineHeight: 1.4 }}>
            Master Docker, Ansible, Terraform, Kubernetes, and more with expert-led video courses and hands-on interactive labs.
          </div>
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
          <div style={{ fontSize: 16, color: "#52525b" }}>
            copypastelearn.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
