/**
 * Commerce seed (T009).
 *
 * Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.commerce.ts
 *
 * Prereqs:
 *   - DATABASE_URL set (Postgres)
 *   - STRIPE_SECRET_KEY set (test-mode key recommended)
 *   - COMMERCE_S3_* set (or COMMERCE_S3_ENDPOINT for MinIO)
 *   - RESEND_API_KEY optional (emails skipped if missing)
 */

import { PrismaClient } from "@prisma/client";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Stripe from "stripe";

const prisma = new PrismaClient();

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getStripe(): Stripe {
  return new Stripe(need("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

function getS3(): { s3: S3Client; bucket: string } {
  const region = need("COMMERCE_S3_REGION");
  const bucket = need("COMMERCE_S3_BUCKET");
  return {
    s3: new S3Client({
      region,
      credentials: {
        accessKeyId: need("COMMERCE_S3_ACCESS_KEY_ID"),
        secretAccessKey: need("COMMERCE_S3_SECRET_ACCESS_KEY"),
      },
      endpoint: process.env.COMMERCE_S3_ENDPOINT,
      forcePathStyle: !!process.env.COMMERCE_S3_ENDPOINT,
    }),
    bucket,
  };
}

async function generateSamplePdf(title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("CopyPasteLearn", { x: 50, y: 780, size: 24, font, color: rgb(0.06, 0.09, 0.16) });
  page.drawText(title, { x: 50, y: 740, size: 16, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText("Sample seed file — replace with your real content.", {
    x: 50,
    y: 700,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  return pdf.save();
}

async function ensureStripeProduct(args: {
  name: string;
  amountMinor: number;
  currency: string;
  metadata: Record<string, string>;
}): Promise<{ productId: string; priceId: string }> {
  const stripe = getStripe();
  // Look up by metadata.slug to be idempotent.
  const slug = args.metadata.slug;
  const existing = await stripe.products.search({
    query: `metadata['slug']:'${slug}' AND active:'true'`,
    limit: 1,
  });
  let productId: string;
  if (existing.data.length) {
    productId = existing.data[0].id;
  } else {
    const created = await stripe.products.create({
      name: args.name,
      tax_code: "txcd_10501000",
      metadata: args.metadata,
    });
    productId = created.id;
  }

  // Find a matching active price; if currency/amount differs, create a new one.
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  const match = prices.data.find(
    (p) =>
      p.unit_amount === args.amountMinor &&
      p.currency.toLowerCase() === args.currency.toLowerCase(),
  );
  const priceId = match
    ? match.id
    : (
        await stripe.prices.create({
          product: productId,
          unit_amount: args.amountMinor,
          currency: args.currency.toLowerCase(),
          tax_behavior: "exclusive",
        })
      ).id;

  return { productId, priceId };
}

async function uploadProductFile(args: {
  productId: string;
  version: string;
  filename: string;
  bytes: Uint8Array;
}): Promise<{ storageKey: string }> {
  const { s3, bucket } = getS3();
  const storageKey = `products/${args.productId}/v${args.version}/${args.filename}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: args.bytes,
      ContentType: "application/pdf",
      ACL: "private",
    }),
  );
  return { storageKey };
}

async function seedProduct(input: {
  slug: string;
  title: string;
  description: string;
  brand: "AnsiblePilot" | "TerraformPilot" | "AnsibleByExample" | "KubernetesRecipes" | "CopyPasteLearn";
  productType: "EBOOK" | "TEMPLATE" | "COURSE";
  amountMinor: number;
  currency: string;
}) {
  const { productId: stripeProductId, priceId: stripePriceId } =
    await ensureStripeProduct({
      name: input.title,
      amountMinor: input.amountMinor,
      currency: input.currency,
      metadata: { slug: input.slug, brand: input.brand, type: input.productType },
    });

  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      subtitle: input.description.slice(0, 200),
      description: input.description,
      stripeProductId,
      stripePriceId,
      priceAmount: input.amountMinor,
      currency: input.currency,
      status: "PUBLISHED",
    },
    create: {
      slug: input.slug,
      title: input.title,
      subtitle: input.description.slice(0, 200),
      description: input.description,
      productType: input.productType,
      brand: input.brand,
      categories: [],
      priceAmount: input.amountMinor,
      currency: input.currency,
      status: "PUBLISHED",
      stripeProductId,
      stripePriceId,
      taxCode: process.env.STRIPE_TAX_CODE_DIGITAL ?? "txcd_10000000",
      canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com"}/shop/${input.slug}`,
    },
  });

  // Ensure at least one current file.
  const hasFile = await prisma.productFile.findFirst({
    where: { productId: product.id, isCurrent: true },
  });
  if (!hasFile) {
    const bytes = await generateSamplePdf(input.title);
    const { storageKey } = await uploadProductFile({
      productId: product.id,
      version: "1.0",
      filename: `${input.slug}.pdf`,
      bytes,
    });
    await prisma.productFile.create({
      data: {
        productId: product.id,
        version: "1.0",
        storageKey,
        sizeBytes: bytes.length,
        contentType: "application/pdf",
        isCurrent: true,
      },
    });
    console.log(`  ✓ uploaded ${storageKey}`);
  }

  console.log(`  ✓ product ${input.slug} (${stripePriceId})`);
  return product;
}

async function seedBundle(input: {
  slug: string;
  title: string;
  description: string;
  amountMinor: number;
  currency: string;
  productSlugs: string[];
}) {
  const { productId: stripeProductId, priceId: stripePriceId } =
    await ensureStripeProduct({
      name: input.title,
      amountMinor: input.amountMinor,
      currency: input.currency,
      metadata: { slug: input.slug, type: "BUNDLE" },
    });

  const bundle = await prisma.bundle.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      description: input.description,
      priceAmount: input.amountMinor,
      currency: input.currency,
      stripeProductId,
      stripePriceId,
      status: "PUBLISHED",
    },
    create: {
      slug: input.slug,
      title: input.title,
      description: input.description,
      priceAmount: input.amountMinor,
      currency: input.currency,
      status: "PUBLISHED",
      stripeProductId,
      stripePriceId,
      taxCode: process.env.STRIPE_TAX_CODE_DIGITAL ?? "txcd_10000000",
      canonicalUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.copypastelearn.com"}/shop/bundles/${input.slug}`,
    },
  });

  // Members
  const products = await prisma.product.findMany({
    where: { slug: { in: input.productSlugs } },
  });
  for (const p of products) {
    await prisma.bundleItem.upsert({
      where: { bundleId_productId: { bundleId: bundle.id, productId: p.id } },
      update: {},
      create: { bundleId: bundle.id, productId: p.id },
    });
  }
  console.log(`  ✓ bundle ${input.slug} (${products.length} items)`);
}

async function seedPolicy(slug: string, version: string, bodyMd: string) {
  await prisma.policyDocument.updateMany({
    where: { slug, isCurrent: true, version: { not: version } },
    data: { isCurrent: false },
  });
  await prisma.policyDocument.upsert({
    where: { slug_version: { slug, version } },
    update: { bodyMd, isCurrent: true },
    create: { slug, version, bodyMd, isCurrent: true, publishedAt: new Date() },
  });
  console.log(`  ✓ policy ${slug}@${version}`);
}

async function main() {
  console.log("🌱 Commerce seed");

  await seedProduct({
    slug: "ansible-automation-playbook",
    title: "Ansible Automation Playbook",
    description: "Production-ready Ansible patterns, roles, and CI templates.",
    brand: "AnsiblePilot",
    productType: "EBOOK",
    amountMinor: 2900,
    currency: "EUR",
  });

  await seedProduct({
    slug: "terraform-modules-library",
    title: "Terraform Modules Library",
    description: "Battle-tested Terraform modules for AWS, GCP, and Azure.",
    brand: "TerraformPilot",
    productType: "TEMPLATE",
    amountMinor: 3900,
    currency: "EUR",
  });

  await seedBundle({
    slug: "devops-copy-paste-bundle",
    title: "DevOps Copy-Paste Bundle",
    description: "Both the Ansible playbook and Terraform library at a discount.",
    amountMinor: 5900,
    currency: "EUR",
    productSlugs: ["ansible-automation-playbook", "terraform-modules-library"],
  });

  await seedPolicy(
    "terms",
    "2026-01",
    "# Terms of Service\n\nPlaceholder seeded body — replace with the legally-reviewed copy.",
  );
  await seedPolicy(
    "privacy",
    "2026-01",
    "# Privacy Policy\n\nPlaceholder seeded body — replace with the legally-reviewed copy.",
  );
  await seedPolicy(
    "refund-policy",
    "2026-01",
    [
      "# Refund Policy",
      "",
      "Refunds are available within 14 days of purchase if the file has not been downloaded.",
      "",
      "Once any file from the order has been downloaded, the order is considered fulfilled and",
      "is non-refundable except where required by local law.",
      "",
      "To request a refund, email support@copypastelearn.com with your order id.",
    ].join("\n"),
  );
  await seedPolicy(
    "digital-delivery-policy",
    "2026-01",
    [
      "# Digital Delivery Policy",
      "",
      "All products are delivered digitally. After payment confirmation we email a time-limited",
      "access link (24 hours, up to 3 downloads). You can always sign in to /library to mint a",
      "fresh link from your purchases.",
      "",
      "By completing checkout, you consent to immediate digital delivery.",
    ].join("\n"),
  );

  console.log("✅ Commerce seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
