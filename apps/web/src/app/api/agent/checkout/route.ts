import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { resolveCartLines, PriceResolutionError } from "@/lib/commerce/pricing";
import { getProvider } from "@/lib/payments/provider";
import { UnsupportedPaymentMethodError } from "@/lib/payments/stripe-spt";
import { commerceFlags } from "@/lib/flags";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { serverLogger } from "@/lib/logger";
// Force registry self-registration of providers.
import "@/lib/payments/stripe-checkout";
import "@/lib/payments/stripe-spt";

export const runtime = "nodejs";

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().min(1),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(20),
  customer: z
    .object({ email: z.string().email().optional() })
    .optional(),
  payment: z.object({
    type: z.enum(["stripe_checkout", "stripe_shared_payment_token"]),
    shared_payment_token: z.string().optional(),
  }),
  metadata: z.record(z.string(), z.string()).optional(),
});

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

function appUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  ).replace(/\/$/, "");
}

function err(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  );
}

/**
 * POST /api/agent/checkout (T102, US8 / FR-038 / FR-043).
 *
 * Routes to the registered payment provider. Today every successful
 * call returns a `redirect` (Stripe Checkout). SPT requests are
 * rejected with `unsupported_payment_method` while the flag is off.
 *
 * NEVER returns protected file URLs (FR-040).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const budget = await rateLimit("agent:ip", clientIp(req));
  if (!budget.success) {
    return err("rate_limited", "Too many requests", 429);
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return err(
      "validation_failed",
      "Invalid checkout request",
      400,
      e instanceof z.ZodError ? e.flatten() : undefined,
    );
  }

  if (
    body.payment.type === "stripe_shared_payment_token" &&
    !commerceFlags.enableStripeSpt
  ) {
    return err(
      "unsupported_payment_method",
      "Stripe Shared Payment Tokens are disabled",
      400,
    );
  }

  let lines;
  try {
    lines = await resolveCartLines(
      body.items.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
    );
  } catch (e) {
    if (e instanceof PriceResolutionError) {
      return err(e.code, e.message, e.code === "product_unavailable" ? 409 : 400);
    }
    throw e;
  }

  const base = appUrl(req);
  const provider = getProvider(body.payment.type);

  try {
    const result = await provider.createCheckout({
      cart: lines,
      customerEmail: body.customer?.email,
      successUrl: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/checkout/cancel`,
      metadata: { ...(body.metadata ?? {}), channel: "agent" },
      sharedPaymentToken: body.payment.shared_payment_token,
    });

    await recordCommerceEvent("checkout_session_created", {
      metadata: { channel: "agent", paymentType: body.payment.type },
    });

    if (result.kind === "redirect") {
      return NextResponse.json({
        checkout_type: "redirect",
        checkout_url: result.checkoutUrl,
        checkout_session_id: result.checkoutSessionId,
        merchant_of_record: "CopyPasteLearn",
        delivery_type: "digital_download",
        ...(result.expiresAt
          ? { expires_at: result.expiresAt.toISOString() }
          : {}),
      });
    }

    return NextResponse.json({
      checkout_type: "completed",
      order_id: result.orderId,
      merchant_of_record: "CopyPasteLearn",
      delivery_type: "digital_download",
      amount: result.amount,
    });
  } catch (e) {
    if (e instanceof UnsupportedPaymentMethodError) {
      return err("unsupported_payment_method", e.message, 400);
    }
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "agent.checkout.failed",
    );
    return err("internal", "Could not create checkout", 500);
  }
}
