import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/settings/", "/labs/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
