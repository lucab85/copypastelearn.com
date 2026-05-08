import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { resolveCartLines, PriceResolutionError } from "@/lib/commerce/pricing";
import { stripeCheckoutProvider } from "@/lib/payments/stripe-checkout";
import { parseAttributionFromRequest } from "@/lib/commerce/attribution";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { serverLogger } from "@/lib/logger";

const BodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        bundleId: z.string().optional(),
        quantity: z.number().int().min(1).max(100).default(1),
      }),
    )
    .min(1)
    .max(20),
  customerEmail: z.string().email().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

function appUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  ).replace(/\/$/, "");
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

function err(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status },
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);
  const limit = await rateLimit("agent:ip", ip);
  if (!limit.success) {
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

  let lines;
  try {
    lines = await resolveCartLines(body.items);
  } catch (e) {
    if (e instanceof PriceResolutionError) {
      return err(e.code, e.message, e.code === "product_unavailable" ? 409 : 400);
    }
    throw e;
  }

  const attribution = parseAttributionFromRequest(req);
  const base = appUrl(req);

  try {
    const result = await stripeCheckoutProvider.createCheckout({
      cart: lines,
      customerEmail: body.customerEmail,
      successUrl:
        body.successUrl ?? `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: body.cancelUrl ?? `${base}/checkout/cancel`,
      metadata: {
        ...(attribution.sourceDomain ? { source_domain: attribution.sourceDomain } : {}),
        ...(attribution.utmSource ? { utm_source: attribution.utmSource } : {}),
        ...(attribution.utmMedium ? { utm_medium: attribution.utmMedium } : {}),
        ...(attribution.utmCampaign ? { utm_campaign: attribution.utmCampaign } : {}),
        ...(attribution.utmContent ? { utm_content: attribution.utmContent } : {}),
        ...(attribution.channel ? { channel: attribution.channel } : {}),
      },
    });

    if (result.kind !== "redirect") {
      return err("internal", "Unexpected provider response", 500);
    }

    await recordCommerceEvent("checkout_session_created", {
      sourceDomain: attribution.sourceDomain,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      metadata: { sessionId: result.checkoutSessionId },
    });

    return NextResponse.json({
      checkoutSessionId: result.checkoutSessionId,
      checkoutUrl: result.checkoutUrl,
      expiresAt: result.expiresAt?.toISOString(),
    });
  } catch (e) {
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "checkout.create.failed",
    );
    return err("internal", "Could not create checkout session", 500);
  }
}
