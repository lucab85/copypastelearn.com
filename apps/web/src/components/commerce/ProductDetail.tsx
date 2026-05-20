import Link from "next/link";
import type { Product } from "@prisma/client";
import {
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
  Receipt,
  Star,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyButton } from "./BuyButton";
import { PolicySummary } from "./PolicySummary";
import { ProductCover } from "./ProductCover";
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

const TYPE_LABEL: Record<string, string> = {
  EBOOK: "Ebook",
  TEMPLATE: "Template",
  COURSE: "Course",
  BUNDLE: "Bundle",
};

const INCLUDED_FEATURES = [
  "Production-tested examples you can copy-paste today",
  "PDF format, optimized for screen and print",
  "Free updates whenever the source CLI changes",
  "Search-friendly, code-block heavy, no fluff",
] as const;

const TRUST = [
  { icon: Download, label: "Instant download" },
  { icon: RefreshCw, label: "Lifetime updates" },
  { icon: ShieldCheck, label: "Secure Stripe checkout" },
  { icon: Receipt, label: "EU VAT invoice" },
] as const;

/**
 * Product detail view. Server-rendered with JSON-LD `Product` +
 * `Offer` for organic discoverability (FR-010).
 */
export function ProductDetail({ product, alreadyOwned = false }: ProductDetailProps) {
  const priceFormatted = formatMoneyAmount(product.priceAmount);
  const canonical = productCanonicalUrl(product.slug);
  const typeLabel = TYPE_LABEL[product.productType] ?? product.productType;
  const brandLabel = BRAND_DISPLAY_NAMES[product.brand];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.subtitle ?? product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    brand: { "@type": "Brand", name: brandLabel },
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
    <article className="mx-auto max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="truncate text-foreground">{product.title}</li>
        </ol>
      </nav>

      {/* HERO — split layout */}
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        {/* Cover */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border shadow-2xl shadow-primary/5">
            <ProductCover
              title={product.title}
              brand={product.brand}
              productType={product.productType}
              imageUrl={product.imageUrl}
              aspect="cover"
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
            />
          </div>

          {/* Trust strip under cover */}
          <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-lg border bg-card/50 px-3 py-2"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column */}
        <div className="space-y-7">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{typeLabel}</Badge>
              <Badge variant="outline">{brandLabel}</Badge>
            </div>
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {product.title}
            </h1>
            {product.subtitle ? (
              <p className="text-pretty text-lg text-muted-foreground">
                {product.subtitle}
              </p>
            ) : null}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-0.5" aria-label="Rated 5 out of 5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <span>Loved by DevOps practitioners</span>
            </div>
          </header>

          {/* Buy box */}
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-lg shadow-primary/5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  One-time purchase
                </div>
                <div className="mt-1 text-4xl font-bold tracking-tight">
                  €{priceFormatted}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    {product.currency}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tax shown at checkout · No subscription
                </div>
              </div>
              {alreadyOwned ? (
                <Badge variant="secondary" className="text-sm">
                  ✓ Already owned
                </Badge>
              ) : null}
            </div>

            <div className="mt-5">
              {alreadyOwned ? (
                <Button asChild size="lg" className="w-full" variant="outline">
                  <Link href="/library">
                    Open library
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <BuyButton productId={product.id} size="lg">
                  Buy now — instant download
                </BuyButton>
              )}
            </div>

            <ul className="mt-5 space-y-2 border-t pt-4 text-sm">
              {INCLUDED_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Description */}
          {product.description ? (
            <section aria-label="About this product" className="space-y-3">
              <h2 className="text-xl font-semibold">About this {typeLabel.toLowerCase()}</h2>
              <div className="prose prose-neutral max-w-none text-pretty leading-relaxed dark:prose-invert">
                {product.description.split("\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}

          <PolicySummary />
        </div>
      </div>
    </article>
  );
}

