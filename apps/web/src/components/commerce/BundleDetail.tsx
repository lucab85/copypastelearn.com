import Image from "next/image";
import Link from "next/link";
import type { Bundle, Product } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "./BuyButton";
import { PolicySummary } from "./PolicySummary";
import {
  formatMoneyAmount,
  bundleCanonicalUrl,
  BRAND_DISPLAY_NAMES,
  absoluteImageUrl,
  digitalShippingDetails,
  digitalReturnPolicy,
} from "@/lib/commerce/catalog";

interface BundleDetailProps {
  bundle: Bundle;
  includedProducts: Product[];
}

/**
 * T082 [US5] — Bundle detail with savings calculation vs. à-la-carte.
 *
 * Server-rendered. Emits JSON-LD `Product`+`Offer` (FR-010).
 * Renders included products and total savings.
 */
export function BundleDetail({ bundle, includedProducts }: BundleDetailProps) {
  const aLaCarteTotal = includedProducts.reduce(
    (sum, p) => sum + p.priceAmount,
    0,
  );
  const savings = Math.max(0, aLaCarteTotal - bundle.priceAmount);
  const priceFormatted = formatMoneyAmount(bundle.priceAmount);
  const aLaCarteFormatted = formatMoneyAmount(aLaCarteTotal);
  const savingsFormatted = formatMoneyAmount(savings);
  const canonical = bundleCanonicalUrl(bundle.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bundle.title,
    description: bundle.description ?? undefined,
    image: absoluteImageUrl(bundle.imageUrl),
    sku: bundle.slug,
    brand: { "@type": "Brand", name: BRAND_DISPLAY_NAMES[bundle.brand] },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: bundle.currency,
      price: priceFormatted,
      priceValidUntil: "2026-12-31",
      availability:
        bundle.status === "PUBLISHED"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "CopyPasteLearn",
      },
      shippingDetails: digitalShippingDetails(bundle.currency),
      hasMerchantReturnPolicy: digitalReturnPolicy(),
    },
  };

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>BUNDLE</Badge>
          <Badge variant="outline">
            {includedProducts.length} products
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{bundle.title}</h1>
      </header>

      {bundle.imageUrl ? (
        <div className="relative h-72 overflow-hidden rounded-lg bg-muted">
          <Image
            src={bundle.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="rounded-md border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">
              €{priceFormatted}{" "}
              <span className="text-base font-normal text-muted-foreground">
                {bundle.currency}
              </span>
            </div>
            {savings > 0 ? (
              <div className="text-sm text-emerald-700 dark:text-emerald-400">
                Save €{savingsFormatted} vs. €{aLaCarteFormatted} buying
                separately
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                One-time purchase · Tax shown at checkout
              </div>
            )}
          </div>
          <BuyButton bundleId={bundle.id} size="lg">
            Buy bundle
          </BuyButton>
        </div>
      </div>

      {bundle.description ? (
        <div className="prose prose-neutral max-w-none">
          {bundle.description.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What's included</h2>
        <ul className="divide-y rounded-md border">
          {includedProducts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/products/${p.slug}`}
                  className="block truncate font-medium hover:underline"
                >
                  {p.title}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {BRAND_DISPLAY_NAMES[p.brand]} · {p.productType}
                </div>
              </div>
              <div className="shrink-0 text-sm text-muted-foreground">
                €{formatMoneyAmount(p.priceAmount)}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <PolicySummary />
    </article>
  );
}
