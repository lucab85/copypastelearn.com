import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/server/queries/catalog";
import { ProductDetail } from "@/components/commerce/ProductDetail";
import { AssistantPanel } from "@/components/commerce/AssistantPanel";
import { productCanonicalUrl } from "@/lib/commerce/catalog";
import { db } from "@/lib/db";

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "PUBLISHED") {
    return { title: "Product not found" };
  }
  return {
    title: product.title,
    description: product.subtitle ?? product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.subtitle ?? product.description.slice(0, 160),
      url: productCanonicalUrl(product.slug),
      type: "website",
      images: product.imageUrl
        ? [{ url: product.imageUrl, width: 1200, height: 630 }]
        : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: PageParams) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "PUBLISHED") notFound();

  // T084 — render "Already owned" when this product is granted to the
  // signed-in buyer (directly or via a bundle). Best-effort; failures
  // never block the page render.
  let alreadyOwned = false;
  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      const clerkUser = await currentUser();
      const emails = (clerkUser?.emailAddresses ?? [])
        .filter((e) => !e.verification || e.verification.status === "verified")
        .map((e) => e.emailAddress.toLowerCase());

      const ent = await db.entitlement.findFirst({
        where: {
          status: "ACTIVE",
          productId: product.id,
          customer: {
            OR: [
              { userId },
              ...(emails.length
                ? emails.map((email) => ({
                    email: { equals: email, mode: "insensitive" as const },
                  }))
                : []),
            ],
          },
        },
        select: { id: true },
      });
      alreadyOwned = Boolean(ent);
    }
  } catch {
    alreadyOwned = false;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <ProductDetail product={product} alreadyOwned={alreadyOwned} />
      {process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true" ? (
        <div className="mx-auto mt-10 max-w-3xl">
          <AssistantPanel />
        </div>
      ) : null}
    </div>
  );
}
