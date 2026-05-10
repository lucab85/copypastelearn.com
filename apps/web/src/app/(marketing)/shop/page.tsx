import Link from "next/link";
import type { Metadata } from "next";
import {
  Download,
  ShieldCheck,
  RefreshCw,
  Receipt,
  Sparkles,
  ArrowRight,
  Star,
  PackageOpen,
} from "lucide-react";
import { listPublishedProducts, listPublishedBundles } from "@/server/queries/catalog";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop — DevOps ebooks, templates & bundles",
  description:
    "Production-tested Ansible, Terraform, and Kubernetes ebooks, templates, and bundles. Instant download, lifetime updates, EU VAT included.",
  alternates: { canonical: "/shop" },
};

interface ShopPageProps {
  searchParams: Promise<{
    brand?: string;
    type?: string;
    category?: string;
  }>;
}

const BRAND_OPTIONS = [
  { value: "", label: "All brands" },
  { value: "AnsiblePilot", label: "AnsiblePilot" },
  { value: "TerraformPilot", label: "TerraformPilot" },
  { value: "KubernetesRecipes", label: "Kubernetes Recipes" },
  { value: "AnsibleByExample", label: "Ansible by Example" },
  { value: "NvidiaAI", label: "NVIDIA AI" },
  { value: "CopyPasteLearn", label: "CopyPasteLearn" },
] as const;

const TYPE_OPTIONS = [
  { value: "", label: "All formats" },
  { value: "EBOOK", label: "Ebooks" },
  { value: "TEMPLATE", label: "Templates" },
  { value: "COURSE", label: "Courses" },
] as const;

const TRUST_BADGES = [
  { icon: Download, label: "Instant download" },
  { icon: RefreshCw, label: "Lifetime updates" },
  { icon: ShieldCheck, label: "Stripe-secured checkout" },
  { icon: Receipt, label: "EU VAT invoice" },
] as const;

/**
 * T107 — Storefront catalog index. Server-rendered, filterable by
 * brand/type/category. Bundles surfaced in their own row above products.
 */
export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;
  const brand =
    sp.brand && BRAND_OPTIONS.some((b) => b.value === sp.brand)
      ? (sp.brand as Exclude<(typeof BRAND_OPTIONS)[number]["value"], "">)
      : undefined;
  const type =
    sp.type && TYPE_OPTIONS.some((t) => t.value === sp.type)
      ? (sp.type as Exclude<(typeof TYPE_OPTIONS)[number]["value"], "">)
      : undefined;
  const category = sp.category?.trim() || undefined;

  const [products, bundles] = await Promise.all([
    listPublishedProducts({ brand: brand ?? undefined, type, category }),
    listPublishedBundles(),
  ]);

  const featuredBundle = bundles[0];
  const otherBundles = bundles.slice(1);
  const hasFilters = Boolean(brand || type || category);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        >
          <div className="absolute left-1/2 top-0 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> The CopyPasteLearn Shop
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Production-grade DevOps playbooks,
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                shipped to your terminal in seconds.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Battle-tested Ansible, Terraform, and Kubernetes ebooks, templates,
              and bundles — written by practitioners who run them in production.
              Instant download. Lifetime updates. EU VAT included.
            </p>

            {/* Trust badges */}
            <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <span className="font-medium text-foreground/80">{label}</span>
                </li>
              ))}
            </ul>

            {/* Social proof */}
            <div className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-center sm:gap-4">
              <div className="flex items-center gap-1" aria-label="Rated 5 out of 5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                ))}
              </div>
              <span className="hidden sm:inline">·</span>
              <span>
                Trusted by <strong className="text-foreground">12,000+</strong> engineers at AWS,
                Red Hat, Booking.com &amp; more.
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 lg:py-16">
        {/* FEATURED BUNDLE */}
        {featuredBundle && !hasFilters && (
          <section aria-labelledby="featured-bundle" className="mb-16">
            <Link
              href={`/bundles/${featuredBundle.slug}`}
              className="group relative block overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 transition-all hover:border-primary hover:shadow-2xl hover:shadow-primary/5 lg:p-12"
            >
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div>
                  <Badge className="mb-4 inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden /> Featured bundle
                  </Badge>
                  <h2
                    id="featured-bundle"
                    className="text-3xl font-bold tracking-tight sm:text-4xl"
                  >
                    {featuredBundle.title}
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    {featuredBundle.description}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    Explore the bundle
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="rounded-xl border bg-card/60 p-6 backdrop-blur">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Bundle price
                  </div>
                  <div className="mt-2 text-4xl font-bold tracking-tight">
                    €{formatMoneyAmount(featuredBundle.priceAmount)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {featuredBundle.currency}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    One-time payment · lifetime access · all updates included.
                  </p>
                  <Button className="mt-5 w-full" size="lg">
                    Get the bundle
                  </Button>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* TOOLBAR + FILTERS */}
        <section aria-labelledby="catalog">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="catalog" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Browse the catalog
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {products.length} product{products.length === 1 ? "" : "s"}
                {hasFilters ? " match your filters" : " available"}
              </p>
            </div>
          </div>

          <form
            className="mb-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card/50 p-3 backdrop-blur"
            role="search"
          >
            <select
              name="brand"
              defaultValue={brand ?? ""}
              className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter by brand"
            >
              {BRAND_OPTIONS.map((b) => (
                <option key={b.value || "all-brands"} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={type ?? ""}
              className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter by format"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value || "all-types"} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="search"
              name="category"
              defaultValue={category ?? ""}
              placeholder="Search by category…"
              className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter by category"
            />
            <Button type="submit" size="sm">
              Apply filters
            </Button>
            {hasFilters && (
              <Button asChild size="sm" variant="ghost">
                <Link href="/shop">Reset</Link>
              </Button>
            )}
          </form>

          {/* Other bundles */}
          {(otherBundles.length > 0 || (featuredBundle && hasFilters)) && (
            <section aria-label="More bundles" className="mb-12">
              <h3 className="mb-4 text-lg font-semibold">More bundles</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(hasFilters ? bundles : otherBundles).map((b) => (
                  <Link
                    key={b.id}
                    href={`/bundles/${b.slug}`}
                    className="group flex flex-col rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                  >
                    <Badge className="mb-3 self-start">Bundle</Badge>
                    <h4 className="text-lg font-semibold leading-snug group-hover:text-primary">
                      {b.title}
                    </h4>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {b.description}
                    </p>
                    <div className="mt-5 flex items-baseline justify-between border-t pt-4">
                      <span className="text-xl font-bold">
                        €{formatMoneyAmount(b.priceAmount)}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        View bundle →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Products grid */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <PackageOpen className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="text-base font-medium">No products match these filters</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different brand or format — or browse the full catalog.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/shop">Clear filters</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* VALUE-STACK FOOTER */}
        <section className="mt-20 grid gap-6 rounded-2xl border bg-gradient-to-br from-muted/40 to-background p-8 sm:grid-cols-2 lg:grid-cols-4 lg:p-10">
          {[
            {
              icon: Download,
              title: "Instant access",
              body: "Download starts the moment payment clears. No waiting, no shipping.",
            },
            {
              icon: RefreshCw,
              title: "Lifetime updates",
              body: "Buy once, get every revision. We keep examples current with the latest CLI.",
            },
            {
              icon: ShieldCheck,
              title: "Secure checkout",
              body: "PCI-DSS Stripe checkout. We never see your card. SCA-ready in EU.",
            },
            {
              icon: Receipt,
              title: "EU VAT invoice",
              body: "Compliant invoice with your VAT ID auto-generated and emailed.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Sold by Open Empower B.V. (Dutch operating entity). All prices in EUR.
          See our{" "}
          <Link href="/refund-policy" className="underline">
            refund policy
          </Link>{" "}
          and{" "}
          <Link href="/digital-delivery-policy" className="underline">
            digital delivery policy
          </Link>
          .
        </p>
      </div>
    </>
  );
}
