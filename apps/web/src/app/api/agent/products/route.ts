import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { listPublishedProducts } from "@/server/queries/catalog";
import { toAgentProductDto } from "@/lib/commerce/agent-dto";

export const runtime = "nodejs";
export const revalidate = 60;

const QuerySchema = z.object({
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
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

/** GET /api/agent/products (T101, US8). */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const budget = await rateLimit("agent:ip", clientIp(req));
  if (!budget.success) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    brand: url.searchParams.get("brand") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_failed",
          message: "Invalid query parameters",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const products = await listPublishedProducts(parsed.data);
  return new NextResponse(
    JSON.stringify({ products: products.map(toAgentProductDto) }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=30",
        "access-control-allow-origin": "*",
      },
    },
  );
}
