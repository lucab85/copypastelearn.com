import fs from "fs";
import path from "path";
import matter from "gray-matter";

// On Vercel serverless, process.cwd() may not include content/.
// Use __dirname to resolve relative to the compiled output, or fall back to cwd.
function getPostsDir(): string {
  // Try cwd first (works in dev and during build)
  const cwdPath = path.join(process.cwd(), "content/blog");
  if (fs.existsSync(cwdPath)) return cwdPath;

  // Fallback: resolve from this file's location (serverless bundles)
  const dirPath = path.resolve(__dirname, "../../../../content/blog");
  if (fs.existsSync(dirPath)) return dirPath;

  return cwdPath; // Return default even if missing (will return [])
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  category: string;
  image?: string;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(getPostsDir())) return [];

  const files = fs
    .readdirSync(getPostsDir())
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(getPostsDir(), filename), "utf-8");
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
        category: data.category ?? "General",
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
  const mdPath = path.join(getPostsDir(), `${slug}.md`);
  const mdxPath = path.join(getPostsDir(), `${slug}.mdx`);
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
    category: data.category ?? "General",
    image: data.image,
    content,
  };
}
