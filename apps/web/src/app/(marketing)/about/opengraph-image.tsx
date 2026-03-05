import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "About CopyPasteLearn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AboutOGImage() {
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
            About Us
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.025em" }}>
            Meet the Instructor
          </div>
          <div style={{ fontSize: 22, color: "#a1a1aa", lineHeight: 1.4 }}>
            Luca Berton — IT automation expert, Red Hat Summit &amp; KubeCon speaker, building hands-on education for DevOps engineers.
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
            copypastelearn.com/about
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
