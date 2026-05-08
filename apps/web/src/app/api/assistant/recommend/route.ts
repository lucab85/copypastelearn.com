import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { recommendProducts } from "@/lib/commerce/assistant";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { serverLogger } from "@/lib/logger";

export const runtime = "nodejs";

const BodySchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(10).optional(),
  brand: z
    .enum([
      "CopyPasteLearn",
      "AnsiblePilot",
      "TerraformPilot",
      "AnsibleByExample",
      "KubernetesRecipes",
    ])
    .optional(),
  category: z.string().trim().min(1).max(64).optional(),
  type: z.enum(["EBOOK", "TEMPLATE", "COURSE", "BUNDLE"]).optional(),
});

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

/**
 * POST /api/assistant/recommend (T088, US6).
 *
 * Returns up to N catalog matches for the user's query. Rate-limited
 * by IP via the `assistant:ip` bucket. Emits one
 * `chat_recommendation_shown` analytics event per request that
 * actually surfaced at least one item (FR-035 / FR-049).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const limit = await rateLimit("assistant:ip", clientIp(req));
  if (!limit.success) {
    return err("rate_limited", "Too many requests", 429);
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return err(
      "validation_failed",
      "Invalid recommend request",
      400,
      e instanceof z.ZodError ? e.flatten() : undefined,
    );
  }

  try {
    const recommendations = await recommendProducts(body.query, {
      limit: body.limit,
      brand: body.brand,
      category: body.category,
      type: body.type,
    });

    if (recommendations.length > 0) {
      await recordCommerceEvent("chat_recommendation_shown", {
        metadata: {
          query: body.query.slice(0, 200),
          count: recommendations.length,
          firstProductId: recommendations[0]?.productId,
        },
      });
    }

    return NextResponse.json({ recommendations });
  } catch (e) {
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "assistant.recommend.failed",
    );
    return err("internal", "Could not produce recommendations", 500);
  }
}
