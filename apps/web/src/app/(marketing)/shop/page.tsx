import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { listPublishedProducts, listPublishedBundles } from "@/server/queries/catalog";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop — DevOps ebooks, templates & bundles",
  description:
    "Buy production-ready Ansible, Terraform, and Kubernetes ebooks, templates, and bundles. Instant download. EU VAT included.",
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
  { value: "KubernetesRecipes", label: "KubernetesRecipes" },
  { value: "AnsibleByExample", label: "Ansible by Example" },
  { value: "CopyPasteLearn", label: "CopyPasteLearn" },
] as const;

const TYPE_OPTIONS = [
  { value: "", label: "All formats" },
  { value: "EBOOK", label: "Ebooks" },
  { value: "TEMPLATE", label: "Templates" },
  { value: "COURSE", label: "Courses" },
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

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      <header className="mx-auto max-w-3xl text-center">
        <Badge variant="secondary" className="mb-4">
          Shop
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          DevOps ebooks, templates &amp; bundles
        </h1>
        <p className="mt-3 text-muted-foreground">
          Production-tested Ansible, Terraform, and Kubernetes content.
          Instant download. EU VAT included.
        </p>
      </header>

      {/* Filters */}
      <form className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-3">
        <select
          name="brand"
          defaultValue={brand ?? ""}
          className="rounded-md border bg-background px-3 py-2 text-sm"
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
          className="rounded-md border bg-background px-3 py-2 text-sm"
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
          placeholder="Category"
          className="rounded-md border bg-background px-3 py-2 text-sm"
          aria-label="Filter by category"
        />
        <Button type="submit" size="sm">
          Apply
        </Button>
        {(brand || type || category) && (
          <Button asChild size="sm" variant="ghost">
            <Link href="/shop">Reset</Link>
          </Button>
        )}
      </form>

      {/* Bundles row */}
      {bundles.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Bundles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.map((b) => (
              <Link
                key={b.id}
                href={`/bundles/${b.slug}`}
                className="block rounded-lg border bg-card p-5 transition hover:border-primary"
              >
                <Badge className="mb-2">Bundle</Badge>
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {b.description}
                </p>
                <div className="mt-4 font-semibold">
                  €{formatMoneyAmount(b.priceAmount)} {b.currency}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products grid */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">
          {products.length} product{products.length === 1 ? "" : "s"}
        </h2>
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            No products match these filters.{" "}
            <Link href="/shop" className="text-primary underline">
              Clear filters
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
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
  );
}
