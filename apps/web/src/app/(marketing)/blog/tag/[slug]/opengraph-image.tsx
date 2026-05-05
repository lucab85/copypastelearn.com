import { ImageResponse } from "next/og";
import { getAllTags, getPostsByTag } from "@/lib/blog-taxonomy";

export const runtime = "nodejs"; // taxonomy reads from disk; not edge-safe
export const alt = "Tag — CopyPasteLearn Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getPostsByTag(slug);
  return [
    {
      contentType: "image/png",
      size,
      alt: data
        ? `Posts tagged "${data.entry.name}" — CopyPasteLearn Blog`
        : alt,
      id: slug,
    },
  ];
}

export async function generateStaticParams() {
  return getAllTags().map((t) => ({ slug: t.slug }));
}

export default async function TagOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getPostsByTag(slug);
  const name = data?.entry.name ?? slug;
  const count = data?.posts.length ?? 0;
  // Pick the 3 most-recent post titles to act as visual proof of depth.
  const recent = (data?.posts ?? []).slice(0, 3).map((p) => p.title);

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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#3b82f6",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Tag · {count} {count === 1 ? "article" : "articles"}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
            }}
          >
            #{name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {recent.map((title) => (
            <div
              key={title}
              style={{
                fontSize: 22,
                color: "#d4d4d8",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 1040,
              }}
            >
              · {title}
            </div>
          ))}
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
            copypastelearn.com/blog/tag/{slug}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
