import type { MetadataRoute } from "next";
import { PrismaClient } from "@prisma/client";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic course + lesson pages
  let coursePages: MetadataRoute.Sitemap = [];
  let lessonPages: MetadataRoute.Sitemap = [];
  try {
    const prisma = new PrismaClient();
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
        lessons: {
          where: { status: "PUBLISHED" },
          select: { slug: true, updatedAt: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    await prisma.$disconnect();

    coursePages = courses.map((course) => ({
      url: `${siteUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    lessonPages = courses.flatMap((course) =>
      course.lessons.map((lesson) => ({
        url: `${siteUrl}/courses/${course.slug}/lessons/${lesson.slug}`,
        lastModified: lesson.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    );
  } catch {
    // If DB is unavailable, return static pages only
  }

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...coursePages, ...lessonPages, ...blogPages];
}
