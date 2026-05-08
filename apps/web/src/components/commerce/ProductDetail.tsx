import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyButton } from "./BuyButton";
import { PolicySummary } from "./PolicySummary";
import {
  formatMoneyAmount,
  productCanonicalUrl,
  BRAND_DISPLAY_NAMES,
} from "@/lib/commerce/catalog";

interface ProductDetailProps {
  product: Product;
  /** When true, render an "Already owned" badge + library link instead of the BuyButton (T084 / US5). */
  alreadyOwned?: boolean;
}

/**
 * Product detail view. Server-rendered with JSON-LD `Product` +
 * `Offer` for organic discoverability (FR-010).
 */
export function ProductDetail({ product, alreadyOwned = false }: ProductDetailProps) {
  const priceFormatted = formatMoneyAmount(product.priceAmount);
  const canonical = productCanonicalUrl(product.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.subtitle ?? product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    brand: { "@type": "Brand", name: BRAND_DISPLAY_NAMES[product.brand] },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: product.currency,
      price: priceFormatted,
      availability:
        product.status === "PUBLISHED"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
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
          <Badge>{product.productType}</Badge>
          <Badge variant="outline">{BRAND_DISPLAY_NAMES[product.brand]}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
        {product.subtitle ? (
          <p className="text-lg text-muted-foreground">{product.subtitle}</p>
        ) : null}
      </header>

      {product.imageUrl ? (
        <div className="relative h-72 overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-md border bg-card p-4">
        <div>
          <div className="text-2xl font-semibold">
            €{priceFormatted}{" "}
            <span className="text-base font-normal text-muted-foreground">
              {product.currency}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            One-time purchase · Tax shown at checkout
          </div>
        </div>
        {alreadyOwned ? (
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary">Already owned</Badge>
            <Button asChild size="lg" variant="outline">
              <Link href="/library">Open library</Link>
            </Button>
          </div>
        ) : (
          <BuyButton productId={product.id} size="lg">
            Buy now
          </BuyButton>
        )}
      </div>

      {product.description ? (
        <div className="prose prose-neutral max-w-none">
          {product.description.split("\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}

      <PolicySummary />
    </article>
  );
}
