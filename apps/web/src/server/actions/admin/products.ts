"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAdminAction } from "@/lib/commerce/audit";
import { getStripe } from "@/lib/payments/stripe-checkout";
import type { Brand, ProductType } from "@prisma/client";

const BRAND_VALUES: [Brand, ...Brand[]] = [
  "CopyPasteLearn",
  "AnsiblePilot",
  "TerraformPilot",
  "AnsibleByExample",
  "KubernetesRecipes",
];

const TYPE_VALUES: [ProductType, ...ProductType[]] = [
  "EBOOK",
  "TEMPLATE",
  "COURSE",
  "BUNDLE",
];

const CreateProductSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  title: z.string().min(2).max(200),
  subtitle: z.string().max(500).optional(),
  description: z.string().min(1).max(20_000),
  productType: z.enum(TYPE_VALUES),
  brand: z.enum(BRAND_VALUES),
  categories: z.array(z.string().min(1).max(50)).max(20).default([]),
  /** Minor units (cents). */
  priceAmount: z.number().int().min(50).max(10_000_000),
  currency: z.string().length(3).default("EUR"),
  imageUrl: z.string().url().optional(),
});

export async function createProduct(input: unknown) {
  const admin = await requireAdmin();
  const data = CreateProductSchema.parse(input);

  // Stripe is the source of truth for the price. Create the product +
  // price first, then persist with Stripe IDs.
  const stripe = getStripe();
  const stripeProduct = await stripe.products.create({
    name: data.title,
    description: data.subtitle ?? data.description.slice(0, 500),
    tax_code: "txcd_10501000",
    metadata: { slug: data.slug, brand: data.brand, type: data.productType },
  });
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: data.priceAmount,
    currency: data.currency.toLowerCase(),
    tax_behavior: "exclusive",
  });

  const product = await db.product.create({
    data: {
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      productType: data.productType,
      brand: data.brand,
      categories: data.categories,
      priceAmount: data.priceAmount,
      currency: data.currency.toUpperCase(),
      imageUrl: data.imageUrl,
      status: "DRAFT",
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "product.create",
    targetType: "Product",
    targetId: product.id,
    payload: { slug: product.slug },
  });

  revalidatePath("/admin/products");
  return { ok: true as const, productId: product.id };
}

const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().min(1),
});

export async function updateProduct(input: unknown) {
  const admin = await requireAdmin();
  const data = UpdateProductSchema.parse(input);
  const { id, ...patch } = data;

  const product = await db.product.update({
    where: { id },
    data: {
      ...(patch.title ? { title: patch.title } : {}),
      ...(patch.subtitle !== undefined ? { subtitle: patch.subtitle } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description }
        : {}),
      ...(patch.categories ? { categories: patch.categories } : {}),
      ...(patch.imageUrl !== undefined
        ? { imageUrl: patch.imageUrl }
        : {}),
      // priceAmount/slug/type/brand/currency intentionally NOT mutable
      // here — they require coordinated Stripe price changes (deferred
      // to a `repriceProduct` action).
    },
  });

  await logAdminAction({
    actorId: admin.id,
    action: "product.update",
    targetType: "Product",
    targetId: product.id,
    payload: { fields: Object.keys(patch) },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${product.slug}`);
  return { ok: true as const };
}

const PublishStateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function setProductStatus(input: unknown) {
  const admin = await requireAdmin();
  const { id, status } = PublishStateSchema.parse(input);

  if (status === "PUBLISHED") {
    // Refuse to publish a product without a current file.
    const file = await db.productFile.findFirst({
      where: { productId: id, isCurrent: true },
    });
    if (!file) {
      throw new Error(
        "Cannot publish: product has no current ProductFile. Upload one first.",
      );
    }
  }

  const product = await db.product.update({
    where: { id },
    data: { status },
  });

  await logAdminAction({
    actorId: admin.id,
    action: `product.${status.toLowerCase()}`,
    targetType: "Product",
    targetId: product.id,
  });

  revalidatePath("/admin/products");
  revalidatePath(`/products/${product.slug}`);
  // T095 — published/archived products affect the feed.
  revalidatePath("/feeds/products.json");
  return { ok: true as const };
}
