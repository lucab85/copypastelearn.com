import type Stripe from "stripe";
import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";
import { mintDownloadToken } from "@/lib/delivery/tokens";
import { sendOrderConfirmationEmail } from "@/lib/fulfillment/email";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { formatMoneyAmount } from "@/lib/commerce/catalog";

/**
 * Idempotent fulfillment of `checkout.session.completed`.
 *
 * Concurrency model:
 *   1. Insert into WebhookEventLog (UNIQUE on provider+eventId).
 *      A duplicate insert throws P2002, which we catch as
 *      "already processed" and short-circuit. (FR-020 / SC-003.)
 *   2. Inside a single Prisma transaction: upsert Customer, create
 *      Order + items + Entitlements pinned to current ProductFile
 *      (A11), then mark the webhook log as processed.
 *   3. Outside the transaction: mint a download token, queue email,
 *      record analytics. These are not idempotency-critical because
 *      they re-derive from the order id and the email job table.
 */
export async function fulfillCheckoutCompleted(
  event: Stripe.Event,
): Promise<{ outcome: "fulfilled" | "duplicate"; orderId?: string }> {
  if (event.type !== "checkout.session.completed") {
    throw new Error(`fulfillCheckoutCompleted called with ${event.type}`);
  }
  const session = event.data.object as Stripe.Checkout.Session;
  if (!session.id) throw new Error("Stripe session missing id");

  // (1) Idempotency gate.
  try {
    await db.webhookEventLog.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      serverLogger.info(
        { eventId: event.id, type: event.type },
        "webhook.duplicate.skipped",
      );
      return { outcome: "duplicate" };
    }
    throw err;
  }

  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;
  if (!customerEmail) {
    throw new Error("Stripe session has no buyer email");
  }

  const billingCountry = session.customer_details?.address?.country ?? undefined;
  const subtotal = session.amount_subtotal ?? 0;
  const taxAmount =
    session.total_details?.amount_tax ?? Math.max(0, (session.amount_total ?? 0) - subtotal);
  const total = session.amount_total ?? subtotal + taxAmount;
  const currency = (session.currency ?? "eur").toUpperCase();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  // Re-fetch line items (Stripe doesn't always include them on the event).
  const stripe = (await import("./../payments/stripe-checkout")).getStripe();
  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(
    session.id,
    { limit: 100, expand: ["data.price.product"] },
  );

  // Map Stripe price -> our Product / Bundle.
  type ResolvedLine =
    | { kind: "product"; productId: string; quantity: number; unitAmount: number }
    | { kind: "bundle"; bundleId: string; quantity: number; unitAmount: number };
  const lines: ResolvedLine[] = [];

  for (const li of lineItemsResponse.data) {
    const stripePriceId = li.price?.id;
    if (!stripePriceId) continue;
    const quantity = li.quantity ?? 1;
    const unitAmount = li.price?.unit_amount ?? 0;

    const product = await db.product.findFirst({ where: { stripePriceId } });
    if (product) {
      lines.push({ kind: "product", productId: product.id, quantity, unitAmount });
      continue;
    }
    const bundle = await db.bundle.findFirst({ where: { stripePriceId } });
    if (bundle) {
      lines.push({ kind: "bundle", bundleId: bundle.id, quantity, unitAmount });
      continue;
    }
    serverLogger.warn(
      { stripePriceId, sessionId: session.id },
      "webhook.unmapped.price",
    );
  }

  if (!lines.length) {
    throw new Error(
      `No catalog items mapped for Stripe session ${session.id} — refusing to fulfill`,
    );
  }

  // (2) Transactional fulfillment.
  const result = await db.$transaction(async (tx) => {
    // Upsert Customer by stripeCustomerId or email.
    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    let customer = stripeCustomerId
      ? await tx.customer.findUnique({ where: { stripeCustomerId } })
      : null;
    if (!customer) {
      customer = await tx.customer.findFirst({ where: { email: customerEmail } });
    }
    if (!customer) {
      customer = await tx.customer.create({
        data: {
          email: customerEmail,
          country: billingCountry,
          stripeCustomerId: stripeCustomerId ?? undefined,
        },
      });
    } else if (
      stripeCustomerId &&
      customer.stripeCustomerId !== stripeCustomerId
    ) {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: { stripeCustomerId, country: billingCountry ?? customer.country },
      });
    }

    // Create the Order.
    const metadata = (session.metadata ?? {}) as Record<string, string>;
    const order = await tx.order.create({
      data: {
        customerId: customer.id,
        status: "PAID",
        subtotalAmount: subtotal,
        taxAmount,
        totalAmount: total,
        currency,
        paymentProvider: "stripe",
        paymentMethod: "STRIPE_CHECKOUT",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        sourceDomain: metadata.source_domain || undefined,
        utmSource: metadata.utm_source || undefined,
        utmMedium: metadata.utm_medium || undefined,
        utmCampaign: metadata.utm_campaign || undefined,
        utmContent: metadata.utm_content || undefined,
        channel: metadata.channel || "storefront",
      },
    });

    // OrderItems + Entitlements (with bundle expansion).
    const grantedProductIds = new Set<string>();

    for (const line of lines) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: line.kind === "product" ? line.productId : null,
          bundleId: line.kind === "bundle" ? line.bundleId : null,
          quantity: line.quantity,
          unitAmount: line.unitAmount,
          currency,
        },
      });

      const productIdsForLine: string[] = [];
      if (line.kind === "product") {
        productIdsForLine.push(line.productId);
      } else {
        const bundleItems = await tx.bundleItem.findMany({
          where: { bundleId: line.bundleId },
        });
        productIdsForLine.push(...bundleItems.map((b) => b.productId));
      }

      for (const productId of productIdsForLine) {
        if (grantedProductIds.has(productId)) continue;
        grantedProductIds.add(productId);

        const currentFile = await tx.productFile.findFirst({
          where: { productId, isCurrent: true },
          orderBy: { createdAt: "desc" },
        });
        await tx.entitlement.create({
          data: {
            customerId: customer.id,
            orderId: order.id,
            productId,
            pinnedFileId: currentFile?.id,
          },
        });
      }
    }

    await tx.webhookEventLog.update({
      where: {
        provider_eventId: { provider: "stripe", eventId: event.id },
      },
      data: { processedAt: new Date() },
    });

    return { customerId: customer.id, customerEmail: customer.email, orderId: order.id };
  });

  // (3) Post-commit side effects: token + email + analytics.
  const entitlements = await db.entitlement.findMany({
    where: { orderId: result.orderId },
    include: { product: true },
  });

  // Mint a token for the first entitlement; the buyer can regenerate
  // others from the library. (Email link drives them through library
  // for multi-product orders.)
  let downloadUrl = `${appUrl()}/library`;
  if (entitlements.length === 1) {
    const minted = await mintDownloadToken({ entitlementId: entitlements[0].id });
    downloadUrl = `${appUrl()}/api/download/${minted.rawToken}`;
  }

  await sendOrderConfirmationEmail({
    to: result.customerEmail,
    orderId: result.orderId,
    amount: formatMoneyAmount(total),
    currency,
    productTitles: entitlements.map((e) => e.product.title),
    downloadUrl,
    supportEmail: "support@copypastelearn.com",
    appUrl: appUrl(),
  });

  await recordCommerceEvent("checkout_completed", {
    customerId: result.customerId,
    orderId: result.orderId,
  });

  return { outcome: "fulfilled", orderId: result.orderId };
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com").replace(
    /\/$/,
    "",
  );
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
