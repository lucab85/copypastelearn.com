import { NextResponse } from "next/server";

// Re-use the blog lib. Since this is a route handler, dynamic imports work fine.
// Note: gray-matter must be installed (added in PR #7).
import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  content: string;
}

function getAllPosts(): Post[] {
  const dir = path.join(process.cwd(), "content/blog");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
      const { data, content } = matter(raw);
      if (data.draft) return null;
      return {
        slug: filename.replace(/\.mdx?$/, ""),
        title: data.title ?? filename,
        description: data.description ?? "",
        date: data.date ?? new Date().toISOString(),
        author: data.author ?? "CopyPasteLearn",
        content,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.date).getTime() - new Date(a!.date).getTime()
    ) as Post[];
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";
  const posts = getAllPosts();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CopyPasteLearn Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Tips, tutorials, and updates on IT automation, Docker, Ansible, and more.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${escapeXml(post.author)}</author>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
