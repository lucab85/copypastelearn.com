import { db } from "@/lib/db";
import type { OrderStatus, Prisma } from "@prisma/client";

/**
 * Admin reporting queries for orders (US3 / SC-009 attribution dashboards).
 *
 * Revenue is computed in **minor units** (Stripe cents) summed over `Order.totalAmount`.
 * Only PAID, REFUNDED, and PARTIALLY_REFUNDED orders are counted; refund deltas
 * live on the `Refund` table and are surfaced separately.
 */

export interface RevenueRow {
  key: string;
  orderCount: number;
  grossMinor: number;
  currency: string;
}

interface RevenueOptions {
  since?: Date;
  until?: Date;
  currency?: string;
}

function whereClause(opts: RevenueOptions): Prisma.OrderWhereInput {
  return {
    status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] satisfies OrderStatus[] },
    ...(opts.currency ? { currency: opts.currency } : {}),
    ...(opts.since || opts.until
      ? {
          createdAt: {
            ...(opts.since ? { gte: opts.since } : {}),
            ...(opts.until ? { lte: opts.until } : {}),
          },
        }
      : {}),
  };
}

export async function revenueBySource(opts: RevenueOptions = {}): Promise<RevenueRow[]> {
  const rows = await db.order.groupBy({
    by: ["sourceDomain", "currency"],
    where: whereClause(opts),
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  return rows
    .map((r) => ({
      key: r.sourceDomain ?? "(direct)",
      orderCount: r._count._all,
      grossMinor: r._sum.totalAmount ?? 0,
      currency: r.currency,
    }))
    .sort((a, b) => b.grossMinor - a.grossMinor);
}

export async function revenueByCampaign(
  opts: RevenueOptions = {},
): Promise<RevenueRow[]> {
  const rows = await db.order.groupBy({
    by: ["utmCampaign", "currency"],
    where: whereClause(opts),
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  return rows
    .map((r) => ({
      key: r.utmCampaign ?? "(none)",
      orderCount: r._count._all,
      grossMinor: r._sum.totalAmount ?? 0,
      currency: r.currency,
    }))
    .sort((a, b) => b.grossMinor - a.grossMinor);
}

export async function revenueByChannel(
  opts: RevenueOptions = {},
): Promise<RevenueRow[]> {
  const rows = await db.order.groupBy({
    by: ["channel", "currency"],
    where: whereClause(opts),
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  return rows
    .map((r) => ({
      key: r.channel ?? "storefront",
      orderCount: r._count._all,
      grossMinor: r._sum.totalAmount ?? 0,
      currency: r.currency,
    }))
    .sort((a, b) => b.grossMinor - a.grossMinor);
}

/** Recent orders for admin lookup tables. */
export async function listRecentOrders(limit = 50) {
  return db.order.findMany({
    take: Math.min(Math.max(1, limit), 200),
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { email: true } },
      items: {
        include: {
          product: { select: { title: true, slug: true } },
          bundle: { select: { title: true, slug: true } },
        },
      },
    },
  });
}

export async function findOrderByEmail(email: string, limit = 25) {
  return db.order.findMany({
    take: Math.min(Math.max(1, limit), 100),
    where: {
      customer: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: { include: { product: true, bundle: true } },
      refunds: true,
    },
  });
}

export async function findOrderByStripeSession(sessionId: string) {
  return db.order.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
    include: {
      customer: true,
      items: { include: { product: true, bundle: true } },
      refunds: true,
    },
  });
}
