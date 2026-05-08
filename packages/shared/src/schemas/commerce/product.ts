import { z } from "zod";

// Mirrors specs/002-agentic-commerce/contracts/schemas/product.schema.json

export const BrandSchema = z.enum([
  "CopyPasteLearn",
  "AnsiblePilot",
  "TerraformPilot",
  "AnsibleByExample",
  "KubernetesRecipes",
]);
export type Brand = z.infer<typeof BrandSchema>;

export const ProductTypeSchema = z.enum(["EBOOK", "TEMPLATE", "COURSE", "BUNDLE"]);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const AvailabilitySchema = z.enum(["in_stock", "out_of_stock", "preorder"]);

export const MoneySchema = z.object({
  amount: z.string().regex(/^\d+(?:\.\d{2})?$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
export type Money = z.infer<typeof MoneySchema>;

export const ProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  brand: BrandSchema,
  type: ProductTypeSchema,
  formats: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  price: MoneySchema,
  availability: AvailabilitySchema,
  delivery_type: z.literal("digital_download").optional(),
  image_url: z.string().url().optional(),
  url: z.string().url(),
  refund_policy_url: z.string().url().optional(),
  digital_delivery_policy_url: z.string().url().optional(),
  seller_of_record: z.string().optional(),
  updated_at: z.string().datetime().optional(),
});
export type Product = z.infer<typeof ProductSchema>;

// Product feed (FR-036) — superset shape per contracts/schemas/product-feed.schema.json
export const ProductFeedItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().url().regex(/^https:\/\//),
  image_url: z.string().url().optional(),
  price: MoneySchema,
  availability: AvailabilitySchema,
  brand: z.string(),
  category: z.string().optional(),
  format: z.string().optional(),
  type: ProductTypeSchema,
  seller: z.string(),
  updated_at: z.string().datetime().optional(),
});
export type ProductFeedItem = z.infer<typeof ProductFeedItemSchema>;

export const ProductFeedSchema = z.object({
  feed_version: z.string(),
  generated_at: z.string().datetime(),
  merchant: z.object({
    name: z.string(),
    store: z.string(),
    country: z.string().regex(/^[A-Z]{2}$/),
  }),
  items: z.array(ProductFeedItemSchema),
});
export type ProductFeed = z.infer<typeof ProductFeedSchema>;
