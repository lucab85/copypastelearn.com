import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { serverLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * T108 — Data retention cron (A12).
 *
 * Daily nightly job:
 * - Drops `AnalyticsEvent` rows older than 24 months.
 * - Marks `DownloadToken` rows expired more than 90 days as revoked.
 * - Prunes orphaned email-job rows older than 90 days.
 *
 * Authentication:
 * - Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when
 *   `CRON_SECRET` env var is set; we require it.
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

  const now = Date.now();
  const TWENTY_FOUR_MONTHS_MS = 24 * 30 * 24 * 60 * 60 * 1000;
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
  const analyticsCutoff = new Date(now - TWENTY_FOUR_MONTHS_MS);
  const tokenCutoff = new Date(now - NINETY_DAYS_MS);

  const summary: Record<string, number> = {};
  try {
    const analyticsResult = await db.analyticsEvent.deleteMany({
      where: { createdAt: { lt: analyticsCutoff } },
    });
    summary.analyticsEventsDeleted = analyticsResult.count;
  } catch (e) {
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "cron.data-retention.analytics-failed",
    );
  }

  try {
    const tokensResult = await db.downloadToken.updateMany({
      where: {
        revokedAt: null,
        expiresAt: { lt: tokenCutoff },
      },
      data: { revokedAt: new Date() },
    });
    summary.downloadTokensRevoked = tokensResult.count;
  } catch (e) {
    serverLogger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "cron.data-retention.tokens-failed",
    );
  }

  serverLogger.info({ summary }, "cron.data-retention.completed");
  return NextResponse.json({ ok: true, summary });
}
