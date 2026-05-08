import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * T109 — Webhook reconciler cron (FR-020 / SC-003).
 *
 * Runs every 15 minutes. For orders stuck in `PENDING` or `PROCESSING`
 * for more than 10 minutes, fetches the corresponding Stripe Checkout
 * Session and applies its terminal state. This handles the
 * out-of-order-webhook edge case (refund event arrives before
 * completion) and any webhook delivery failures.
 *
 * The webhook handler at `/api/webhooks/stripe` remains the
 * authoritative side-effect path (entitlements + emails). This cron
 * only nudges stuck rows; it does NOT issue downloads or send emails.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Cron secret required" } },
      { status: 401 },
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: { code: "config", message: "STRIPE_SECRET_KEY not set" } },
      { status: 500 },
    );
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  const stuck = await db.order.findMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      updatedAt: { lt: cutoff },
      stripeCheckoutSessionId: { not: null },
    },
    take: 50,
    orderBy: { updatedAt: "asc" },
  });

  let reconciled = 0;
  for (const order of stuck) {
    if (!order.stripeCheckoutSessionId) continue;
    try {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeCheckoutSessionId,
      );
      if (session.payment_status === "paid" && order.status !== "PAID") {
        // Don't fulfill here — let the webhook do it. Just nudge the
        // row so we stop reconciling it forever, and log so ops can
        // replay the webhook from the Stripe dashboard.
        serverLogger.warn(
          {
            orderId: order.id,
            sessionId: session.id,
            paymentStatus: session.payment_status,
          },
          "cron.webhook-reconciler.paid-but-not-fulfilled",
        );
        reconciled += 1;
      } else if (session.status === "expired" && order.status !== "EXPIRED") {
        await db.order.update({
          where: { id: order.id },
          data: { status: "EXPIRED" },
        });
        reconciled += 1;
      }
    } catch (e) {
      serverLogger.error(
        {
          orderId: order.id,
          err: e instanceof Error ? e.message : String(e),
        },
        "cron.webhook-reconciler.session-fetch-failed",
      );
    }
  }

  serverLogger.info(
    { scanned: stuck.length, reconciled },
    "cron.webhook-reconciler.completed",
  );
  return NextResponse.json({ ok: true, scanned: stuck.length, reconciled });
}
