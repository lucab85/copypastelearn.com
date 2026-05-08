import { db } from "@/lib/db";
import type { CartLine } from "@/lib/payments/provider";

/**
 * Server-side price resolution (FR-006): NEVER trust client-supplied
 * amounts. Given a list of {productId|bundleId, quantity}, return
 * the authoritative cart lines from the catalog.
 */

export interface CartLineRequest {
  productId?: string;
  bundleId?: string;
  quantity: number;
}

export class PriceResolutionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function resolveCartLines(
  requested: CartLineRequest[],
): Promise<CartLine[]> {
  if (!requested.length) {
    throw new PriceResolutionError("validation_failed", "Cart is empty");
  }

  const lines: CartLine[] = [];

  for (const item of requested) {
    if (item.quantity < 1 || item.quantity > 100) {
      throw new PriceResolutionError(
        "validation_failed",
        "quantity must be between 1 and 100",
      );
    }
    if (!item.productId && !item.bundleId) {
      throw new PriceResolutionError(
        "validation_failed",
        "Each cart item requires productId or bundleId",
      );
    }
    if (item.productId && item.bundleId) {
      throw new PriceResolutionError(
        "validation_failed",
        "Each cart item must specify exactly one of productId or bundleId",
      );
    }

    if (item.productId) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || product.status !== "PUBLISHED") {
        throw new PriceResolutionError(
          "product_unavailable",
          `Product ${item.productId} is not available`,
        );
      }
      if (!product.stripePriceId) {
        throw new PriceResolutionError(
          "product_unavailable",
          `Product ${item.productId} has no Stripe price configured`,
        );
      }
      lines.push({
        productId: product.id,
        quantity: item.quantity,
        unitAmount: product.priceAmount,
        currency: product.currency,
        stripePriceId: product.stripePriceId,
        title: product.title,
      });
    } else if (item.bundleId) {
      const bundle = await db.bundle.findUnique({
        where: { id: item.bundleId },
      });
      if (!bundle || bundle.status !== "PUBLISHED") {
        throw new PriceResolutionError(
          "product_unavailable",
          `Bundle ${item.bundleId} is not available`,
        );
      }
      if (!bundle.stripePriceId) {
        throw new PriceResolutionError(
          "product_unavailable",
          `Bundle ${item.bundleId} has no Stripe price configured`,
        );
      }
      lines.push({
        bundleId: bundle.id,
        quantity: item.quantity,
        unitAmount: bundle.priceAmount,
        currency: bundle.currency,
        stripePriceId: bundle.stripePriceId,
        title: bundle.title,
      });
    }
  }

  // Currency consistency — cart can't mix currencies.
  const currencies = new Set(lines.map((l) => l.currency));
  if (currencies.size > 1) {
    throw new PriceResolutionError(
      "validation_failed",
      "Cart cannot mix currencies",
    );
  }

  return lines;
}
