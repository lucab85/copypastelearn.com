/**
 * Commerce seed (T009).
 *
 * Idempotent. Run with:
 *   pnpm --filter @copypastelearn/web exec tsx prisma/seed.commerce.ts
 *
 * Prereqs:
 *   - DATABASE_URL set (Postgres)
 *   - STRIPE_SECRET_KEY set (test-mode key recommended)
 *   - BLOB_READ_WRITE_TOKEN set (Vercel Blob store)
 *   - RESEND_API_KEY optional (emails skipped if missing)
 */

import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Stripe from "stripe";
import { generateTerraformModulesLibraryPdf } from "./seeds/terraform-modules-library.pdf";

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

function ensureBlobToken(): void {
  need("BLOB_READ_WRITE_TOKEN");
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
  ensureBlobToken();
  const storageKey = `products/${args.productId}/v${args.version}/${args.filename}`;
  await put(storageKey, Buffer.from(args.bytes), {
    access: "private",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
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
  fileVersion?: string;
  pdfFactory?: () => Promise<Uint8Array>;
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

  // Ensure the requested file version is present and marked current.
  const version = input.fileVersion ?? "1.0";
  const existingThisVersion = await prisma.productFile.findFirst({
    where: { productId: product.id, version },
  });
  const existingCurrent = await prisma.productFile.findFirst({
    where: { productId: product.id, isCurrent: true },
  });

  // If a pdfFactory is provided, always regenerate and (re)upload the bytes so
  // content updates land in the blob even when the version string hasn't been
  // bumped, or when a prior seed run already created a row at this version
  // pointing to stale content. The blob put() is overwrite-safe.
  // If no factory is provided, only upload when the version row is missing.
  const shouldUpload = input.pdfFactory ? true : !existingThisVersion;

  if (shouldUpload) {
    const bytes = input.pdfFactory
      ? await input.pdfFactory()
      : await generateSamplePdf(input.title);
    const { storageKey } = await uploadProductFile({
      productId: product.id,
      version,
      filename: `${input.slug}.pdf`,
      bytes,
    });
    if (existingThisVersion) {
      // Refresh row: same storageKey (overwritten), update size, ensure current.
      if (existingCurrent && existingCurrent.id !== existingThisVersion.id) {
        await prisma.productFile.update({
          where: { id: existingCurrent.id },
          data: { isCurrent: false },
        });
      }
      await prisma.productFile.update({
        where: { id: existingThisVersion.id },
        data: {
          storageKey,
          sizeBytes: bytes.length,
          contentType: "application/pdf",
          isCurrent: true,
        },
      });
      console.log(`  ✓ refreshed ${storageKey} (${bytes.length} bytes)`);
    } else {
      if (existingCurrent) {
        await prisma.productFile.update({
          where: { id: existingCurrent.id },
          data: { isCurrent: false },
        });
      }
      await prisma.productFile.create({
        data: {
          productId: product.id,
          version,
          storageKey,
          sizeBytes: bytes.length,
          contentType: "application/pdf",
          isCurrent: true,
        },
      });
      console.log(`  ✓ uploaded ${storageKey} (${bytes.length} bytes)`);
    }
  } else if (existingThisVersion && !existingThisVersion.isCurrent) {
    if (existingCurrent && existingCurrent.id !== existingThisVersion.id) {
      await prisma.productFile.update({
        where: { id: existingCurrent.id },
        data: { isCurrent: false },
      });
    }
    await prisma.productFile.update({
      where: { id: existingThisVersion.id },
      data: { isCurrent: true },
    });
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
    description: [
      "Battle-tested Terraform modules for AWS, GCP, and Azure — the ones we run in production, packaged with documentation, examples, and a CI/CD baseline so you can ship infrastructure on day one.",
      "",
      "What's inside:",
      "• 20 modules across networking, container platforms (EKS, GKE, AKS), managed Postgres, identity (IRSA, Workload Identity, Managed Identity), and observability.",
      "• Per-module README with inputs, outputs, an architecture diagram, and a copy-paste example root configuration.",
      "• Sensible, opinionated defaults: multi-AZ, encrypted at rest, private endpoints, least-privilege IAM, flow logs.",
      "• Pre-commit hooks: terraform fmt, validate, tflint, tfsec, trivy.",
      "• Reusable GitHub Actions and GitLab CI templates for plan/apply pipelines with manual approval gates.",
      "• Semantic versioning per module. Pin with `version = \"1.1.0\"` and upgrade safely.",
      "",
      "Tested against Terraform 1.7 and 1.8. Lifetime updates while the modules are maintained, delivered via /library.",
    ].join("\n"),
    brand: "TerraformPilot",
    productType: "TEMPLATE",
    amountMinor: 3900,
    currency: "EUR",
    fileVersion: "1.1",
    pdfFactory: generateTerraformModulesLibraryPdf,
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
    "2026-05",
    "# Terms of Service\n\nThe canonical Terms of Service are rendered from `apps/web/src/app/(marketing)/terms/page.tsx`. This PolicyDocument row exists so checkout, invoice templates, and webhook receipts can reference a versioned identifier (terms@2026-05).",
  );
  await seedPolicy(
    "privacy",
    "2026-05",
    "# Privacy Policy\n\nThe canonical Privacy Policy is rendered from `apps/web/src/app/(marketing)/privacy/page.tsx`. This PolicyDocument row exists so checkout, invoice templates, and webhook receipts can reference a versioned identifier (privacy@2026-05).",
  );
  await seedPolicy(
    "refund-policy",
    "2026-05",
    [
      "# Refund Policy",
      "",
      "_Open Empower B.V., operator of CopyPasteLearn — Last updated: May 2026 (version 2026-05)_",
      "",
      "This Refund Policy explains when and how we issue refunds for purchases made on www.copypastelearn.com. It supplements, and does not override, mandatory consumer-protection rights granted to EU consumers under Directive 2011/83/EU and applicable national law.",
      "",
      "## 1. Statutory right of withdrawal (EU consumers)",
      "",
      "If you are an EU consumer (a natural person purchasing for non-professional purposes), you normally have **14 days** from the day of purchase to withdraw from the contract without giving a reason, under Art. 9 of Directive 2011/83/EU.",
      "",
      "**Important — digital content exception:** At checkout you explicitly consent to the immediate performance of the contract and acknowledge that, once performance has begun, you lose your right of withdrawal in accordance with Art. 16(m) of the Directive. Performance is deemed to have begun when:",
      "",
      "- you download any file from your order (ebooks, templates, playbooks), or",
      "- you start streaming any video lesson from a course or subscription, or",
      "- you launch any interactive lab session.",
      "",
      "If you have not started consuming the product within 14 days, you may still withdraw by emailing support@copypastelearn.com with your order ID and a written withdrawal statement.",
      "",
      "## 2. One-time digital products (ebooks, templates, playbooks)",
      "",
      "- **Full refund** within 14 days if no file from the order has been downloaded.",
      "- **No refund** once any file has been downloaded, except where required by mandatory law or if the file is materially defective and we are unable to provide a corrected version within a reasonable time.",
      "",
      "## 3. Course bundles and one-time course purchases",
      "",
      "- **Full refund** within 14 days if no lesson video has been started and no lab has been launched.",
      "- **Pro-rata refund** at our discretion if a documented technical issue prevented you from accessing more than 50% of the content during the first 30 days.",
      "",
      "## 4. Subscriptions",
      "",
      "- You can **cancel your subscription at any time** from your account dashboard or by emailing support. Cancellation stops the next renewal; you retain access until the end of the period you have already paid for.",
      "- We do **not** provide pro-rated refunds for unused portions of a paid period, except where required by law.",
      "- **First-period refund:** if you cancel within 14 days of your initial paid period and you have not viewed more than the first lesson of any course nor launched any paid lab, we will refund the period in full.",
      "",
      "## 5. Renewals",
      "",
      "Automatic renewals are charged to the payment method on file at the price displayed at the time of renewal. If a renewal is charged in error (for example, after a cancellation we failed to record), contact us within 30 days and we will refund the renewal in full.",
      "",
      "## 6. Defective or undelivered products",
      "",
      "If a product cannot be delivered, is materially defective, or does not match its description on the product page, you are entitled to repair, replacement, or a full refund regardless of whether you have started consuming it. Contact support@copypastelearn.com with your order ID and a description of the problem.",
      "",
      "## 7. How to request a refund",
      "",
      "Send an email to **support@copypastelearn.com** including:",
      "",
      "1. your order ID (visible in your purchase confirmation email and at `/library`);",
      "2. the email address associated with the purchase;",
      "3. the product or subscription you want refunded;",
      "4. a brief reason (optional but helpful).",
      "",
      "## 8. Processing time and method",
      "",
      "Approved refunds are issued to the **original payment method** within **14 days** of approval. Stripe usually returns funds within 5–10 business days, depending on your bank. We do not issue refunds in cash, store credit, or to a different payment method unless required by law.",
      "",
      "## 9. Chargebacks",
      "",
      "If you have a problem with a charge, please contact us first — most issues are resolved within a day. Initiating a chargeback without first attempting to contact us may result in account suspension while the dispute is being investigated.",
      "",
      "## 10. Contact",
      "",
      "Open Empower B.V. — Customer Support",
      "Email: support@copypastelearn.com",
    ].join("\n"),
  );
  await seedPolicy(
    "digital-delivery-policy",
    "2026-05",
    [
      "# Digital Delivery Policy",
      "",
      "_Open Empower B.V., operator of CopyPasteLearn — Last updated: May 2026 (version 2026-05)_",
      "",
      "This Digital Delivery Policy describes how and when you receive the digital products and services you buy on www.copypastelearn.com.",
      "",
      "## 1. Products covered",
      "",
      "- **Ebooks, templates, and playbooks** — delivered as downloadable files (PDF, EPUB, or archives of source files).",
      "- **Video courses** — streamed on demand inside your `/library` dashboard.",
      "- **Interactive labs** — ephemeral, browser-accessible sandbox environments.",
      "- **Subscriptions** — recurring access to a curated catalog of courses and labs.",
      "",
      "## 2. When delivery happens",
      "",
      "Delivery is **immediate**. As soon as Stripe confirms a successful payment (typically within seconds), our webhook provisions your entitlement. You will receive:",
      "",
      "1. an order confirmation email with your invoice attached, and",
      "2. a separate email with a time-limited access link for each file in the order.",
      "",
      "Your purchases also appear instantly in `/library` once you sign in with the email used at checkout.",
      "",
      "## 3. Time-limited access links",
      "",
      "Files are delivered through signed, time-limited URLs to protect both you and us against abuse:",
      "",
      "- **Validity:** each link expires **24 hours** after it is generated.",
      "- **Download cap:** each link allows up to **3 successful downloads**.",
      "- **Re-issuing:** you can mint a fresh link at any time from `/library`. The number of fresh links you can mint is not artificially limited; we monitor only for sharing patterns that suggest the link is being redistributed.",
      "",
      "If a link expires before you finish downloading, simply visit `/library` and request a new one.",
      "",
      "## 4. Streaming access (courses and labs)",
      "",
      "Course videos are streamed through Mux and are tied to your authenticated account. They cannot be downloaded; we provide unlimited replays for as long as your entitlement or subscription remains active.",
      "",
      "Lab environments are ephemeral. When you launch a lab, we provision a sandboxed container or VM for a limited duration (see the course page for per-lab caps). Anything you write inside the lab is destroyed at session end. **Do not store personal data, secrets, or production credentials inside a lab.**",
      "",
      "## 5. Lifetime updates",
      "",
      "Products marketed with &quot;lifetime updates&quot; entitle you to all future revisions of the same product for as long as we continue to maintain it. Updates appear in `/library` and we email you when a new version is published.",
      "",
      "&quot;Lifetime&quot; refers to the lifetime of the product, not the buyer; we may discontinue an individual product, but if we do we will give 90 days&apos; notice and let you download the final version before access ends.",
      "",
      "## 6. Compatibility and system requirements",
      "",
      "- **Ebooks:** PDF (any modern PDF reader), EPUB (any modern e-reader).",
      "- **Templates / playbooks:** require the tool documented on the product page (Ansible, Terraform, Kubernetes, etc.).",
      "- **Video:** any modern browser; mobile browsers are supported.",
      "- **Labs:** desktop browser recommended; minimum 1 Mbps connection.",
      "",
      "We do not refund purchases for incompatibility that was disclosed on the product page before checkout. If you are unsure whether a product fits your environment, contact us **before** buying.",
      "",
      "## 7. Failed or missing delivery",
      "",
      "If you have not received your order confirmation within 30 minutes:",
      "",
      "1. check your spam / promotions folder;",
      "2. sign in to `/library` using the email used at checkout (entitlements provision in real-time);",
      "3. if the order is still missing, email support@copypastelearn.com with your order ID.",
      "",
      "We will deliver or fully refund any undelivered order reported within **30 days** of the original charge.",
      "",
      "## 8. Restrictions and license",
      "",
      "All deliveries are licensed for personal or single-organization use. Resale, sublicensing, or republication of the original files is not permitted; using the included code, templates, and snippets inside your own projects (including paid client work) is permitted. The full license terms are in our [Terms of Service](/terms).",
      "",
      "## 9. Customer responsibilities",
      "",
      "- Keep your account email up to date so delivery and renewal notices reach you.",
      "- Do not share access links or account credentials.",
      "- Back up the files you download; we keep them available in `/library`, but you are responsible for your local copies.",
      "",
      "## 10. Contact",
      "",
      "Open Empower B.V. — Customer Support",
      "Email: support@copypastelearn.com",
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
