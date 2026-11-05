import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

// Node, not edge: the card reads the course from Postgres through Prisma, which
// does not run on the edge runtime. On edge every course card answered 500
// (Nov 2026), so the 9 course pages that use this card shared a broken image.
export const alt = "Course";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CourseOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Only what the card shows. getCourse() also resolves the signed-in user and
  // their subscription, which an image request has no business doing.
  const course = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      description: true,
      difficulty: true,
      lessons: { where: { status: "PUBLISHED" }, select: { durationSeconds: true } },
    },
  });

  if (!course) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#09090b",
            color: "#fafafa",
            fontSize: 48,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Course not found
        </div>
      ),
      { ...size }
    );
  }

  const totalDuration = course.lessons.reduce(
    (acc, l) => acc + (l.durationSeconds ?? 0),
    0
  );
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const durationText =
    totalDuration > 0
      ? `${hours > 0 ? `${hours}h ` : ""}${minutes}m`
      : undefined;

  const difficultyColors: Record<string, { bg: string; text: string }> = {
    BEGINNER: { bg: "#166534", text: "#86efac" },
    INTERMEDIATE: { bg: "#854d0e", text: "#fde047" },
    ADVANCED: { bg: "#991b1b", text: "#fca5a5" },
  };
  const diffColor = difficultyColors[course.difficulty] ?? {
    bg: "#1e3a5f",
    text: "#93c5fd",
  };

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

        {/* Badge row. Satori renders a <div> only with one child node or display:flex,
            so each badge's text is a single template string (a mixed "📚 {n} lessons"
            made every course card answer 500, Nov 2026). */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              backgroundColor: diffColor.bg,
              color: diffColor.text,
              fontSize: 16,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {course.difficulty.toLowerCase()}
          </div>
          {durationText && (
            <div
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                backgroundColor: "#18181b",
                color: "#a1a1aa",
                fontSize: 16,
                fontWeight: 500,
                border: "1px solid #27272a",
              }}
            >
              {`🕐 ${durationText}`}
            </div>
          )}
          <div
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              backgroundColor: "#18181b",
              color: "#a1a1aa",
              fontSize: 16,
              fontWeight: 500,
              border: "1px solid #27272a",
            }}
          >
            {`📚 ${course.lessons.length} lessons`}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            marginBottom: 20,
            maxWidth: "90%",
          }}
        >
          {course.title}
        </div>

        {/* Description */}
        {course.description && (
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              lineHeight: 1.4,
              maxWidth: "80%",
              display: "flex",
            }}
          >
            {course.description.length > 120
              ? course.description.slice(0, 120) + "…"
              : course.description}
          </div>
        )}

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
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
