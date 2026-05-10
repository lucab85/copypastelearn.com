import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { verifyAndConsumeToken } from "@/lib/delivery/tokens";
import { fetchPrivateBlob } from "@/lib/delivery/storage";
import { recordCommerceEvent } from "@/lib/commerce/analytics";
import { serverLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://copypastelearn.com";
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function recoveryErr(code: string, message: string, status: number) {
  // T059 — for token-lifecycle errors, surface a recovery URL pointing
  // buyers back to /library so they can mint a fresh link without
  // contacting support (US2-3).
  return NextResponse.json(
    {
      error: {
        code,
        message,
        recover_url: `${appUrl()}/library`,
      },
    },
    { status },
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await ctx.params;
  const ip = clientIp(req);

  const ipBudget = await rateLimit("download:ip", ip);
  if (!ipBudget.success) return err("rate_limited", "Too many requests", 429);

  const tokenBudget = await rateLimit("download:token", token.slice(0, 32));
  if (!tokenBudget.success) return err("rate_limited", "Too many requests", 429);

  const verify = await verifyAndConsumeToken(token);
  if (!verify.ok) {
    // T059 — friendly 410s for expired/exhausted/revoked tokens with a
    // recover_url back to /library; the legacy specific codes are kept
    // alongside the user-facing `token_expired_or_consumed` rollup so
    // automated clients (US8) still get precise diagnostics.
    if (
      verify.reason === "expired" ||
      verify.reason === "consumed" ||
      verify.reason === "revoked"
    ) {
      return recoveryErr(
        "token_expired_or_consumed",
        "This download link is no longer valid. Sign in to your library to generate a fresh link.",
        410,
      );
    }
    const map: Record<typeof verify.reason, [number, string, string]> = {
      not_found: [404, "token_invalid", "Invalid download token"],
      entitlement_inactive: [
        403,
        "entitlement_revoked",
        "Access to this file has been revoked",
      ],
    };
    const [status, code, message] = map[verify.reason];
    return err(code, message, status);
  }

  // Stamp first-access for refund-eligibility logic (US4 / FR-048).
  // Best-effort; never block the download on this write.
  try {
    await db.entitlement.updateMany({
      where: { id: verify.token.entitlementId, firstAccessedAt: null },
      data: { firstAccessedAt: new Date() },
    });
  } catch (e) {
    serverLogger.warn(
      { err: e instanceof Error ? e.message : String(e) },
      "download.first_access_stamp_failed",
    );
  }

  // Resolve the file pinned to the entitlement (A11).
  const ent = await db.entitlement.findUnique({
    where: { id: verify.token.entitlementId },
    include: { product: true },
  });
  if (!ent) return err("token_invalid", "Entitlement not found", 404);

  const file = ent.pinnedFileId
    ? await db.productFile.findUnique({ where: { id: ent.pinnedFileId } })
    : await db.productFile.findFirst({
        where: { productId: ent.productId, isCurrent: true },
        orderBy: { createdAt: "desc" },
      });
  if (!file) return err("file_unavailable", "No file available for product", 410);

  const filename = sanitizeFilename(`${ent.product.slug}-v${file.version}.pdf`);
  let blob: Awaited<ReturnType<typeof fetchPrivateBlob>>;
  try {
    blob = await fetchPrivateBlob(file.storageKey);
  } catch (e) {
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "download.blob_fetch.failed",
    );
    return err("internal", "Could not fetch file", 500);
  }
  if (!blob) {
    serverLogger.error({ storageKey: file.storageKey }, "download.blob_not_found");
    return err("file_unavailable", "File missing from storage", 410);
  }

  await recordCommerceEvent("file_downloaded", {
    customerId: ent.customerId,
    productId: ent.productId,
    metadata: {
      tokenId: verify.token.id,
      downloadCount: verify.token.downloadCount,
    },
  });

  const headers = new Headers({
    "Content-Type": blob.contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  });
  if (blob.size != null) headers.set("Content-Length", String(blob.size));
  return new NextResponse(blob.stream, { status: 200, headers });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}
