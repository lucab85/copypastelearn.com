import type { Bundle, Product } from "@prisma/client";
import { db } from "@/lib/db";
import {
  productCanonicalUrl,
  bundleCanonicalUrl,
  BRAND_DISPLAY_NAMES,
} from "@/lib/commerce/catalog";

/**
 * T093 [US7] — Build the public product feed.
 *
 * Conforms to `contracts/schemas/product-feed.schema.json`.
 * Includes only PUBLISHED products and bundles. Never includes
 * any protected file URL (FR-040).
 */

export interface FeedMerchant {
  name: string;
  store: string;
  country: string;
}

export interface FeedItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  image_url?: string;
  price: { amount: string; currency: string };
  availability: "in_stock" | "out_of_stock" | "preorder";
  brand: string;
  category?: string;
  format?: string;
  type: "EBOOK" | "TEMPLATE" | "COURSE" | "BUNDLE";
  seller: string;
  updated_at?: string;
}

export interface ProductFeed {
  feed_version: string;
  generated_at: string;
  merchant: FeedMerchant;
  items: FeedItem[];
}

const FEED_VERSION = "1.0";

function defaultMerchant(): FeedMerchant {
  return {
    name: "CopyPasteLearn",
    store: process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com",
    country: process.env.COMMERCE_MERCHANT_COUNTRY ?? "IT",
  };
}

function minorToString(amount: number): string {
  // Always render as N.NN (FR-046: prices are tax-exclusive net amounts).
  return (amount / 100).toFixed(2);
}

function productToItem(p: Product): FeedItem {
  return {
    id: p.id,
    title: p.title,
    description: p.subtitle ?? p.description?.slice(0, 500) ?? undefined,
    url: productCanonicalUrl(p.slug),
    image_url: p.imageUrl ?? undefined,
    price: {
      amount: minorToString(p.priceAmount),
      currency: p.currency.toUpperCase(),
    },
    availability: "in_stock",
    brand: BRAND_DISPLAY_NAMES[p.brand] ?? p.brand,
    category: p.categories[0],
    format: p.productType.toLowerCase(),
    type: p.productType,
    seller: "CopyPasteLearn",
    updated_at: p.updatedAt.toISOString(),
  };
}

function bundleToItem(b: Bundle): FeedItem {
  return {
    id: b.id,
    title: b.title,
    description: b.description?.slice(0, 500) ?? undefined,
    url: bundleCanonicalUrl(b.slug),
    image_url: b.imageUrl ?? undefined,
    price: {
      amount: minorToString(b.priceAmount),
      currency: b.currency.toUpperCase(),
    },
    availability: "in_stock",
    brand: "CopyPasteLearn",
    type: "BUNDLE",
    format: "bundle",
    seller: "CopyPasteLearn",
    updated_at: b.updatedAt.toISOString(),
  };
}

export async function buildProductFeed(): Promise<ProductFeed> {
  const [products, bundles] = await Promise.all([
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
    }),
    db.bundle.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    feed_version: FEED_VERSION,
    generated_at: new Date().toISOString(),
    merchant: defaultMerchant(),
    items: [...products.map(productToItem), ...bundles.map(bundleToItem)],
  };
}
