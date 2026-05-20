import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getBundleBySlug } from "@/server/queries/catalog";
import { BundleDetail } from "@/components/commerce/BundleDetail";
import { buildCatalogMetaDescription, bundleCanonicalUrl } from "@/lib/commerce/catalog";

// Per-request memoization so generateMetadata + the page body share one DB call.
const loadBundle = cache(getBundleBySlug);

interface PageParams {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await loadBundle(slug);
  if (!bundle || bundle.status !== "PUBLISHED") {
    return { title: "Bundle not found" };
  }
  const metaDescription = buildCatalogMetaDescription({
    kind: "bundle",
    title: bundle.title,
    description: bundle.description,
    brand: bundle.brand,
  });
  return {
    title: bundle.title,
    description: metaDescription,
    alternates: { canonical: `/bundles/${bundle.slug}` },
    openGraph: {
      title: bundle.title,
      description: metaDescription,
      url: bundleCanonicalUrl(bundle.slug),
      type: "website",
      images: [
        bundle.imageUrl
          ? { url: bundle.imageUrl, width: 1200, height: 630, alt: bundle.title }
          : { url: "/opengraph-image", width: 1200, height: 630, alt: bundle.title },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BundleDetailPage({ params }: PageParams) {
  const { slug } = await params;
  const bundle = await loadBundle(slug);
  if (!bundle || bundle.status !== "PUBLISHED") notFound();

  const items = await db.bundleItem.findMany({
    where: { bundleId: bundle.id },
    include: { product: true },
  });
  // Only surface published included products in the public detail view.
  const includedProducts = items
    .map((i) => i.product)
    .filter((p) => p.status === "PUBLISHED");

  return (
    <div className="container mx-auto px-4 py-12">
      <BundleDetail bundle={bundle} includedProducts={includedProducts} />
    </div>
  );
}
