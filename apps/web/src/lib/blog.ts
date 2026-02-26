import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image?: string;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8");
      const { data, content } = matter(raw);

      // Skip drafts
      if (data.draft) return null;

      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? new Date().toISOString(),
        author: data.author ?? "Luca Berton",
        tags: data.tags ?? [],
        image: data.image,
        content,
      } satisfies BlogPost;
    })
    .filter(Boolean) as BlogPost[];

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

export function getPost(slug: string): BlogPost | null {
  const mdPath = path.join(POSTS_DIR, `${slug}.md`);
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const filePath = fs.existsSync(mdPath)
    ? mdPath
    : fs.existsSync(mdxPath)
      ? mdxPath
      : null;

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  if (data.draft) return null;

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? new Date().toISOString(),
    author: data.author ?? "Luca Berton",
    tags: data.tags ?? [],
    image: data.image,
    content,
  };
}
