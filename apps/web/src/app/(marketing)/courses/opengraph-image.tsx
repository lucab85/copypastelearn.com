import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CopyPasteLearn Courses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function CoursesOGImage() {
  const courses = [
    { title: "Docker Fundamentals", level: "Beginner" },
    { title: "Node.js REST APIs", level: "Intermediate" },
    { title: "Ansible Quickstart", level: "Beginner" },
    { title: "OpenClaw Agent", level: "Beginner" },
  ];

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

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40 }}>
          <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Course Catalog
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.025em" }}>
            Learn IT Automation by Doing
          </div>
          <div style={{ fontSize: 20, color: "#71717a" }}>
            Video lessons + hands-on interactive labs
          </div>
        </div>

        {/* Course grid */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {courses.map((c) => (
            <div
              key={c.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "16px 20px",
                borderRadius: 12,
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                minWidth: 240,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>{c.title}</div>
              <div
                style={{
                  fontSize: 13,
                  color: c.level === "Intermediate" ? "#fbbf24" : "#22c55e",
                  fontWeight: 600,
                }}
              >
                {c.level}
              </div>
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
            copypastelearn.com/courses
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
