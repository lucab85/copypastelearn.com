import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";

export const runtime = "edge";
export const alt = "Blog Post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  const title = post?.title ?? "Blog Post";
  const date = post?.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const tags = post?.tags?.slice(0, 3) ?? [];

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

        {/* Blog label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              backgroundColor: "#1e3a5f",
              color: "#93c5fd",
              fontSize: 14,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Blog
          </div>
          {date && (
            <div style={{ fontSize: 14, color: "#71717a" }}>{date}</div>
          )}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: "90%",
          }}
        >
          {title.length > 80 ? title.slice(0, 80) + "…" : title}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  backgroundColor: "#18181b",
                  color: "#a1a1aa",
                  fontSize: 15,
                  fontWeight: 500,
                  border: "1px solid #27272a",
                }}
              >
                {tag}
              </div>
            ))}
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
            copypastelearn.com/blog
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
