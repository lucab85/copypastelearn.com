export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";
import { PrismaClient } from "@prisma/client";
import { getAllPosts } from "@/lib/blog";
import { getAllTags, getAllCategories } from "@/lib/blog-taxonomy";

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
      url: `${siteUrl}/ai-platform-engineering`,
      lastModified: new Date(),
      changeFrequency: "weekly",
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
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/digital-delivery-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Dynamic course + lesson pages
  let coursePages: MetadataRoute.Sitemap = [];
  let lessonPages: MetadataRoute.Sitemap = [];
  let productPages: MetadataRoute.Sitemap = [];
  let bundlePages: MetadataRoute.Sitemap = [];
  try {
    const prisma = new PrismaClient();
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
        lessons: {
          where: { status: "PUBLISHED", sortOrder: 0 },
          select: { slug: true, updatedAt: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Commerce: products and bundles
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
    const bundles = await prisma.bundle.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
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

    productPages = products.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    bundlePages = bundles.map((bundle) => ({
      url: `${siteUrl}/bundles/${bundle.slug}`,
      lastModified: bundle.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
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

  // Blog tag + category index pages.
  // Lower priority than posts; refreshed weekly because new posts shift them.
  const tagPages: MetadataRoute.Sitemap = getAllTags().map((t) => ({
    url: `${siteUrl}/blog/tag/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((c) => ({
    url: `${siteUrl}/blog/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...coursePages,
    ...lessonPages,
    ...productPages,
    ...bundlePages,
    ...blogPages,
    ...tagPages,
    ...categoryPages,
  ];
}
