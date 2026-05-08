import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { serverLogger } from "@/lib/logger";

export const runtime = "nodejs";

const BodySchema = z.object({
  order_id: z.string().min(1),
  email: z.string().email(),
  reason: z.string().trim().min(1).max(500).optional(),
});

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * POST /api/agent/refund-request (T104, US8 / FR-038).
 *
 * Records a buyer-initiated refund request. Does NOT issue the
 * refund — admin reviews and acts via processRefund (T069). Buyer
 * email must match the order's customer (mitigates random-id probes).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const budget = await rateLimit("agent:ip", clientIp(req));
  if (!budget.success) {
    return err("rate_limited", "Too many requests", 429);
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return err("validation_failed", "Invalid refund request", 400);
  }

  const order = await db.order.findUnique({
    where: { id: body.order_id },
    include: { customer: { select: { email: true } } },
  });
  if (!order) {
    // Do not leak existence — same response as email mismatch.
    return err("not_found", "No matching order", 404);
  }
  if (order.customer.email.toLowerCase() !== body.email.toLowerCase()) {
    return err("not_found", "No matching order", 404);
  }

  try {
    await db.refund.create({
      data: {
        orderId: order.id,
        provider: "stripe",
        amount: 0, // 0 = full refund requested; admin determines actual amount
        currency: order.currency,
        status: "requested",
        reason: body.reason,
      },
    });
    await recordCommerceEvent("refund_requested", {
      orderId: order.id,
      metadata: { channel: "agent" },
    });
  } catch (e) {
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "agent.refund-request.failed",
    );
    return err("internal", "Could not record refund request", 500);
  }

  return NextResponse.json({
    status: "received",
    order_id: order.id,
    message:
      "Refund request received. An admin will review and follow up by email.",
  });
}
